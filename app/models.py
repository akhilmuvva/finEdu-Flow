from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from app.database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    family_income = Column(Float)

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    principal_amount = Column(Float)
    interest_rate = Column(Float)
    course_duration = Column(Integer)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RepaymentStrategy(Base):
    __tablename__ = "repayment_strategies"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    strategy_name = Column(String) # e.g., "1 Extra EMI/Year"
    extra_emi_count = Column(Integer)
    estimated_savings = Column(Float)
