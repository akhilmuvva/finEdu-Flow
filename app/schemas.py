from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LoanBase(BaseModel):
    principal_amount: float
    interest_rate: float
    course_duration: int
    family_income: float

class LoanCreate(LoanBase):
    pass

class LoanResponse(LoanBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RepaymentSimulationRequest(BaseModel):
    loan_amount: float
    interest_rate: float
    tenure_years: int
    extra_emi_per_year: int = 1
    family_income: float
    course_duration: int

class RepaymentSimulationResponse(BaseModel):
    original_months: int
    accelerated_months: int
    months_saved: int
    total_interest_paid: float
    emi: float
    total_principal: float
    subvention_details: dict
    tax_benefit_80E: float
