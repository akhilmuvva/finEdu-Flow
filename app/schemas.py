from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    family_income: Decimal = Field(..., ge=0)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime = datetime.now()

    class Config:
        from_attributes = True

# --- Strategy Schemas ---
class StrategyBase(BaseModel):
    name: str
    monthly_top_up: Decimal = Decimal('0.00')
    annual_lumpsum: Decimal = Decimal('0.00')
    extra_emi_per_year: int = 0

class StrategyCreate(StrategyBase):
    pass

class StrategyResponse(StrategyBase):
    id: int
    estimated_interest_savings: Decimal
    months_saved: int

    class Config:
        from_attributes = True

# --- Loan Schemas ---
class LoanBase(BaseModel):
    principal_amount: Decimal = Field(..., gt=0)
    interest_rate: Decimal = Field(..., gt=0)
    course_duration_years: int = Field(..., gt=0)
    tenure_years: int = Field(..., gt=0)

class LoanCreate(LoanBase):
    user_id: int

class LoanResponse(LoanBase):
    id: int
    user_id: int
    subvention_type: str
    moratorium_interest: Decimal
    capitalized_principal: Decimal
    status: str
    created_at: datetime
    strategies: List[StrategyResponse] = []

    class Config:
        from_attributes = True

# --- Original Simulation Schemas (Refined) ---
class RepaymentSimulationRequest(BaseModel):
    loan_amount: Decimal
    interest_rate: Decimal
    tenure_years: int
    extra_emi_per_year: int = 0
    family_income: Decimal
    course_duration: int

class RepaymentSimulationResponse(BaseModel):
    emi: Decimal
    total_principal: Decimal
    subvention_details: Dict[str, Any]
    tax_benefit_80E: Decimal
    months_saved: int
    total_interest_paid: Decimal
    repayment_schedule: List[Dict[str, Any]]

class ScenarioResult(BaseModel):
    name: str
    total_interest: Decimal
    months: int
    interest_saved: Decimal
    months_saved: int

class ScenarioComparisonResponse(BaseModel):
    scenarios: List[ScenarioResult]
