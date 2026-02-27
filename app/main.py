from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from decimal import Decimal

from app.database import engine, get_db, Base
from app import models, schemas
from app.services.calculator import LoanCalculator

# Initialize DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinnEDu - Premium FinTech Backend",
    description="Advanced Education Loan Logic with Database Persistence (2026 Compliance)",
    version="1.2.0"
)

# Reference Rates
LIVE_RATES = {
    "SBI_EBLR": Decimal('7.90'),
    "HDFC_EBLR": Decimal('7.90'),
    "AS_OF": "2026-02-27"
}

# --- USER ENDPOINTS ---

@app.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=user.password, # In production, use pwd_context.hash(user.password)
        family_income=user.family_income
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- LOAN PERSISTENCE ENDPOINTS ---

@app.post("/loans", response_model=schemas.LoanResponse)
def save_loan(loan_in: schemas.LoanCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == loan_in.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Use the Calculator to compute 2026 Compliance Metadata
    calc = LoanCalculator(
        loan_amount=loan_in.principal_amount,
        interest_rate=loan_in.interest_rate,
        course_duration_years=loan_in.course_duration_years,
        family_income=user.family_income
    )
    
    subv_info = calc.calculate_subventions()
    moratorium_int = calc.calculate_moratorium_interest()
    emi_data = calc.calculate_emi(loan_in.tenure_years)
    
    new_loan = models.Loan(
        user_id=loan_in.user_id,
        principal_amount=loan_in.principal_amount,
        interest_rate=loan_in.interest_rate,
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

@app.get("/users/{user_id}/loans", response_model=List[schemas.LoanResponse])
def get_user_loans(user_id: int, db: Session = Depends(get_db)):
    loans = db.query(models.Loan).filter(models.Loan.user_id == user_id).all()
    return loans

# --- SIMULATION & COMPARISON ---

@app.post("/simulate", response_model=schemas.RepaymentSimulationResponse)
def simulate_loan(request: schemas.RepaymentSimulationRequest):
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income
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
        "repayment_schedule": schedule
    }

@app.post("/compare", response_model=schemas.ScenarioComparisonResponse)
def compare_scenarios(request: schemas.ScenarioComparisonRequest):
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income
    )
    
    baseline = calc.get_full_schedule(request.tenure_years)
    extra_emi = calc.get_full_schedule(request.tenure_years, extra_emi_per_year=1)
    
    # 10% Monthly Top-up logic
    emi_data = calc.calculate_emi(request.tenure_years)
    top_up = (emi_data["emi"] * Decimal('0.10')).quantize(Decimal('0.01'))
    monthly_boost = calc.get_full_schedule(request.tenure_years, monthly_top_up=top_up)
    
    lumpsum = calc.get_full_schedule(request.tenure_years, annual_lumpsum=Decimal('50000'))
    
    def summarize(sched, name):
        total_int = sum(Decimal(str(m["interest"])) for m in sched)
        return {
            "name": name,
            "total_interest": total_int,
            "months": len(sched),
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

@app.get("/rates")
def get_live_rates():
    return LIVE_RATES
