from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app import models, schemas
from app.services.calculator import LoanCalculator

# Initialize DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinnEDu - Premium FinTech Backend",
    description="Advanced Education Loan Logic for 2026 Indian Banking Compliance",
    version="1.0.0"
)

# Reference Rates (Fetched via Browser Agent)
LIVE_RATES = {
    "SBI_EBLR": 7.90,
    "HDFC_EBLR": 7.90,
    "AS_OF": "2026-02-27"
}

@app.get("/")
def root():
    return {"message": "Welcome to FinnEDu API", "rates": LIVE_RATES}

@app.post("/simulate", response_model=schemas.RepaymentSimulationResponse)
def simulate_loan(request: schemas.RepaymentSimulationRequest):
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income
    )
    
    subv = calc.calculate_subventions()
    emi, total_principal = calc.calculate_emi(request.tenure_years)
    
    # Aggressive Repayment Strategy
    simulation = calc.simulate_aggressive_repayment(
        emi=emi, 
        total_principal=total_principal, 
        tenure_years=request.tenure_years,
        extra_emi_per_year=request.extra_emi_per_year
    )
    
    # Tax Benefit (80E)
    tax_benefit = calc.calculate_80E_benefit(emi, total_principal, request.tenure_years)
    
    return {
        **simulation,
        "emi": round(emi, 2),
        "total_principal": round(total_principal, 2),
        "subvention_details": subv,
        "tax_benefit_80E": round(tax_benefit, 2)
    }

@app.post("/clear-fast", response_model=schemas.RepaymentSimulationResponse)
def clear_fast(request: schemas.RepaymentSimulationRequest):
    """
    Simulates aggressive repayment strategy: 
    - Defaults to paying 1 extra EMI per year.
    - Highlights interest savings and time reduction.
    """
    calc = LoanCalculator(
        loan_amount=request.loan_amount,
        interest_rate=request.interest_rate,
        course_duration_years=request.course_duration,
        family_income=request.family_income
    )
    
    emi, total_principal = calc.calculate_emi(request.tenure_years)
    simulation = calc.simulate_aggressive_repayment(
        emi, total_principal, request.tenure_years, request.extra_emi_per_year
    )
    
    subv = calc.calculate_subventions()
    tax_benefit = calc.calculate_80E_benefit(emi, total_principal, request.tenure_years)

    return {
        **simulation,
        "emi": round(emi, 2),
        "total_principal": round(total_principal, 2),
        "subvention_details": subv,
        "tax_benefit_80E": round(tax_benefit, 2)
    }

@app.get("/rates")
def get_live_rates():
    return LIVE_RATES
