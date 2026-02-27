from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) # For future auth
    family_income = Column(Numeric(precision=15, scale=2))
    
    loans = relationship("Loan", back_populates="owner")
    audit_logs = relationship("AuditLog", back_populates="user")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # e.g., "SIMULATE_LOAN", "SAVE_LOAN"
    metadata_json = Column(String) # Detailed params for audit trail
    status_code = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Core Loan Details
    principal_amount = Column(Numeric(precision=15, scale=2))
    interest_rate = Column(Numeric(precision=5, scale=2))
    course_duration_years = Column(Integer)
    tenure_years = Column(Integer)
    
    # 2026 Compliance Metadata
    subvention_type = Column(String) # CSIS, PM-Vidyalaxmi, or None
    moratorium_interest = Column(Numeric(precision=15, scale=2))
    capitalized_principal = Column(Numeric(precision=15, scale=2))
    
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="loans")
    strategies = relationship("RepaymentStrategy", back_populates="loan")

class RepaymentStrategy(Base):
    __tablename__ = "repayment_strategies"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    
    name = Column(String) # e.g., "1 Extra EMI/Year"
    monthly_top_up = Column(Numeric(precision=15, scale=2), default=0)
    annual_lumpsum = Column(Numeric(precision=15, scale=2), default=0)
    extra_emi_per_year = Column(Integer, default=0)
    
    estimated_interest_savings = Column(Numeric(precision=15, scale=2))
    months_saved = Column(Integer)
    
    loan = relationship("Loan", back_populates="strategies")
