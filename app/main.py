from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal
from jose import JWTError, jwt
from datetime import timedelta

from app.database import engine, get_db, Base
from app import models, schemas, auth
from app.services.calculator import LoanCalculator
from app.services.reports import PDFReportProvider
from app.services.forex import ForexService
from fastapi.responses import StreamingResponse
import json

# Initialize DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinnEDu - Premium FinTech Backend",
    description="Advanced Education Loan Logic with JWT Security (2026 Compliance)",
    version="1.3.0"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        await ForexService.update_cached_rates(db)
    finally:
        db.close()

# RLLR Benchmark 2026 Mandate
RLLR_BASE = Decimal('6.50')
TIER_SPREADS = {
    "AAA": Decimal('1.50'), # Premier (8.00%)
    "AA": Decimal('1.70'),  # High Grade (8.20%)
    "A": Decimal('2.50'),   # Standard (9.00%)
}
DEFAULT_SPREAD = Decimal('2.50')
BANK_SPREADS = {
    "SBI": Decimal('1.65'), 
    "HDFC": Decimal('1.85')
}

# --- AUTH DEPENDENCY ---

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ENDPOINTS ---

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=auth.get_password_hash(user.password),
        family_income=user.family_income
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- LOAN PERSISTENCE ENDPOINTS (PROTECTED) ---

@app.post("/loans", response_model=schemas.LoanResponse)
def save_loan(
    loan_in: schemas.LoanBase, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Determine spread based on Tier/Category
    spread = TIER_SPREADS.get(loan_in.university_tier, DEFAULT_SPREAD)
    effective_rate = RLLR_BASE + spread

    # Use the Calculator to compute 2026 Compliance Metadata
    # QHEI is True for AAA, AA, A categories
    is_qhei_status = loan_in.university_tier in ["AAA", "AA", "A"]
    
    calc = LoanCalculator(
        loan_amount=loan_in.principal_amount,
        interest_rate=effective_rate,
        course_duration_years=loan_in.course_duration_years,
        family_income=current_user.family_income,
        is_qhei=is_qhei_status
    )
    
    subv_info = calc.calculate_subventions()
    moratorium_int = calc.calculate_moratorium_interest()
    emi_data = calc.calculate_emi(loan_in.tenure_years)
    
    new_loan = models.Loan(
        user_id=current_user.id,
        principal_amount=loan_in.principal_amount,
        interest_rate=effective_rate,
        university_name=loan_in.university_name,
        university_tier=loan_in.university_tier,
        course_duration_years=loan_in.course_duration_years,
        tenure_years=loan_in.tenure_years,
        subvention_type=subv_info["label"],
        moratorium_interest=moratorium_int,
        capitalized_principal=emi_data["capitalized_principal"]
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

@app.get("/loans", response_model=List[schemas.LoanResponse])
def get_my_loans(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    loans = db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()
    return loans

# --- SIMULATION & COMPARISON (OPEN) ---

def generate_recommendations(loan_amount: Decimal, interest_paid: Decimal, is_qhei: bool, family_income: Decimal, currency: str) -> List[Dict[str, str]]:
    recommendations = []
    
    # Moratorium Tip
    recommendations.append({
        "strategy": "Pay Interest During Moratorium",
        "impact": "High",
        "description": "Paying simple interest monthly during college prevents capitalization, potentially saving you over ₹2-4 Lakhs in the long run."
    })
    
    # Tax Tip
    recommendations.append({
        "strategy": "Maximize Section 80E",
        "impact": "Medium",
        "description": "Interest paid on education loans is fully deductible from taxable income for 8 years. Your parents can co-apply to maximize this."
    })
    
    # Prepayment Tip
    recommendations.append({
        "strategy": "The 1-Extra-EMI Rule",
        "impact": "High",
        "description": "Paying just 1 extra EMI per year can reduce your 10-year loan tenure by nearly 22 months."
    })
    
    # Forex Tip (if applicable)
    if currency != "INR":
        recommendations.append({
            "strategy": "Forex Hedging / SIP",
            "impact": "Critical",
            "description": "Set up an INR SIP today to hedge against future Rupee depreciation before your overseas repayment begins."
        })
        
    # Subsidy Awareness
    if family_income <= Decimal('450000'):
        recommendations.append({
            "strategy": "Verify CSIS Claim",
            "impact": "Total",
            "description": "Your income qualifies for a FULL interest subsidy. Ensure your bank marks your loan as CSIS-eligible in their portal."
        })
        
    return recommendations

@app.post("/simulate", response_model=schemas.RepaymentSimulationResponse)
def simulate_loan(request: schemas.RepaymentSimulationRequest, db: Session = Depends(get_db)):
    # Try to find university in DB
    university = None
    forex_rate = Decimal('1.00')
    currency = "INR"
    
    if request.is_foreign:
        university = db.query(models.ForeignInstitution).filter(models.ForeignInstitution.name == request.university_name).first()
        if university:
            forex_rate = ForexService.get_rate(db, university.currency)
            currency = university.currency
            effective_rate = RLLR_BASE + Decimal('2.50') # Standard International Spread
            is_qhei_val = False # Usually domestic subventions don't apply fully to foreign
    else:
        university = db.query(models.University).filter(models.University.name == request.university_name).first()
        if university:
            effective_rate = Decimal(str(university.base_interest_rate))
            is_qhei_val = university.is_qhei
        else:
            effective_rate = RLLR_BASE + DEFAULT_SPREAD
            is_qhei_val = False

    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=effective_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income,
        is_qhei=is_qhei_val,
        currency=currency,
        forex_rate=forex_rate
    )
    
    subv = calc.calculate_subventions()
    emi_data = calc.calculate_emi(request.tenure_years)
    schedule = calc.get_full_schedule(
        tenure_years=request.tenure_years,
        extra_emi_per_year=request.extra_emi_per_year
    )
    
    total_interest_paid = sum(Decimal(str(m["interest"])) for m in schedule)
    months_saved = (request.tenure_years * 12) - len(schedule)
    tax_benefit = calc.calculate_80E_benefit(schedule)
    
    return {
        "emi": emi_data["emi"],
        "total_principal": emi_data["capitalized_principal"],
        "subvention_details": subv,
        "tax_benefit_80E": tax_benefit,
        "months_saved": months_saved,
        "total_interest_paid": total_interest_paid,
        "repayment_schedule": schedule,
        "recommendations": generate_recommendations(
            request.loan_amount * forex_rate, 
            total_interest_paid, 
            is_qhei_val, 
            request.family_income,
            currency
        )
    }

@app.post("/compare", response_model=schemas.ScenarioComparisonResponse)
def compare_scenarios(request: schemas.ScenarioComparisonRequest):
    # This logic remains the same
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income
    )
    
    baseline = calc.get_full_schedule(request.tenure_years)
    extra_emi = calc.get_full_schedule(request.tenure_years, extra_emi_per_year=1)
    emi_data = calc.calculate_emi(request.tenure_years)
    top_up = (emi_data["emi"] * Decimal('0.10')).quantize(Decimal('0.01'))
    monthly_boost = calc.get_full_schedule(request.tenure_years, monthly_top_up=top_up)
    lumpsum = calc.get_full_schedule(request.tenure_years, annual_lumpsum=Decimal('50000'))
    
    def summarize(sched, name):
        total_int = sum(Decimal(str(m["interest"])) for m in sched)
        return {
            "name": name, "total_interest": total_int, "months": len(sched),
            "interest_saved": sum(Decimal(str(m["interest"])) for m in baseline) - total_int,
            "months_saved": len(baseline) - len(sched)
        }

    return {
        "scenarios": [
            summarize(baseline, "Baseline (Standard)"),
            summarize(extra_emi, "1 Extra EMI/Year"),
            summarize(monthly_boost, "10% Monthly Top-up"),
            summarize(lumpsum, "50k Annual Lumpsum")
        ]
    }

@app.get("/loans/{loan_id}/report")
def get_loan_report(
    loan_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    loan = db.query(models.Loan).filter(
        models.Loan.id == loan_id, 
        models.Loan.user_id == current_user.id
    ).first()
    
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Re-calculate or fetch summary data
    calc = LoanCalculator(
        loan_amount=loan.principal_amount,
        interest_rate=loan.interest_rate,
        course_duration_years=loan.course_duration_years,
        family_income=current_user.family_income
    )
    emi_data = calc.calculate_emi(loan.tenure_years)
    schedule = calc.get_full_schedule(loan.tenure_years)
    tax_benefit = calc.calculate_80E_benefit(schedule)

    loan_details = {
        "principal_amount": loan.principal_amount,
        "interest_rate": loan.interest_rate,
        "course_duration_years": loan.course_duration_years,
        "subvention_type": loan.subvention_type,
        "university_name": loan.university_name,
        "university_tier": loan.university_tier
    }
    
    repayment_summary = {
        "moratorium_interest": loan.moratorium_interest,
        "capitalized_principal": loan.capitalized_principal,
        "emi": emi_data["emi"],
        "tax_benefit_80E": tax_benefit
    }

    # Audit Log Entry
    audit_entry = models.AuditLog(
        user_id=current_user.id,
        action="GENERATE_PDF_REPORT",
        metadata_json=json.dumps({"loan_id": loan_id}),
        status_code=200
    )
    db.add(audit_entry)
    db.commit()

    pdf_buffer = PDFReportProvider.generate_loan_projection(
        user_name=current_user.full_name,
        loan_details=loan_details,
        repayment_summary=repayment_summary
    )
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=FinnEDu_Projection_{loan_id}.pdf"}
    )

@app.post("/advisor", response_model=schemas.AdvisorResponse)
def financial_advisor(request: schemas.AdvisorRequest):
    """
    Hackathon AI Feature: Recommends the optimal use of extra funds.
    Compares Interest Savings vs SIP Wealth Gain.
    """
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=4, # Assuming standard 4y for advisory
        family_income=request.family_income
    )
    
    analysis = calc.calculate_opportunity_cost(
        extra_monthly=request.extra_monthly_budget,
        investment_roi=request.investment_roi_expectation
    )
    return analysis

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    System Health & Analytics for Hackathon Dashboards.
    Returns counts of users, loans, and audit events.
    """
    user_count = db.query(models.User).count()
    loan_count = db.query(models.Loan).count()
    audit_count = db.query(models.AuditLog).count()
    
    return {
        "status": "Healthy",
        "version": "1.3.0-Hackathon-Ed",
        "stats": {
            "total_users": user_count,
            "total_loans_managed": loan_count,
            "compliance_events_logged": audit_count
        },
        "engine": "FinnEDu High-Precision 2026"
    }

@app.get("/universities", response_model=List[schemas.UniversityResponse])
def get_universities(db: Session = Depends(get_db)):
    """Returns official 2026 university data from the database."""
    universities = db.query(models.University).order_by(models.University.nirf_2026).all()
    return universities

@app.get("/foreign-universities", response_model=List[schemas.ForeignInstitutionResponse])
def get_foreign_universities(db: Session = Depends(get_db)):
    """Returns top foreign institutions for international study logic."""
    return db.query(models.ForeignInstitution).order_by(models.ForeignInstitution.ranking_qs).all()

@app.get("/forex", response_model=List[schemas.ForexRateResponse])
def get_forex_rates(db: Session = Depends(get_db)):
    """Returns real-time cached forex rates from the 2026 market logic."""
    return db.query(models.ForexRate).all()

@app.get("/rates")
def get_live_rates():
    return {
        "RLLR_BASE": RLLR_BASE,
        "SBI_EBLR": RLLR_BASE + BANK_SPREADS["SBI"],
        "HDFC_EBLR": RLLR_BASE + BANK_SPREADS["HDFC"],
        "AS_OF": "2026-02-27"
    }
