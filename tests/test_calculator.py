import pytest
from decimal import Decimal
from app.services.calculator import LoanCalculator

def test_csis_eligibility():
    # CSIS: Income <= 4.5L
    calc = LoanCalculator(
        loan_amount=Decimal('500000'),
        interest_rate=Decimal('8.0'),
        course_duration_years=2,
        family_income=Decimal('400000')
    )
    subv = calc.calculate_subventions()
    assert subv["csis_eligible"] is True
    assert calc.calculate_moratorium_interest() == Decimal('0.00')

def test_vidyalaxmi_eligibility():
    # PM-Vidyalaxmi: Income <= 8L, Loan <= 10L
    calc = LoanCalculator(
        loan_amount=Decimal('800000'),
        interest_rate=Decimal('10.0'),
        course_duration_years=2,
        family_income=Decimal('600000')
    )
    subv = calc.calculate_subventions()
    assert subv["csis_eligible"] is False
    assert subv["vidyalaxmi_eligible"] is True
    # Effective rate 10% - 3% = 7%. Moratorium = 3 years (2+1).
    # Simple Interest = 800,000 * 0.07 * 3 = 168,000
    assert calc.calculate_moratorium_interest() == Decimal('168000.00')

def test_emi_calculation():
    calc = LoanCalculator(
        loan_amount=Decimal('1000000'),
        interest_rate=Decimal('12.0'),
        course_duration_years=1,
        family_income=Decimal('1000000') # Not eligible for subvention
    )
    # Moratorium = 2 years. SI = 1,000,000 * 0.12 * 2 = 240,000.
    # Total Principal = 1,240,000. 
    # EMI for 5 years (60 months) at 1% monthly.
    emi_data = calc.calculate_emi(tenure_years=5)
    assert emi_data["capitalized_principal"] == Decimal('1240000.00')
    # Use standard formula result for verification
    expected_emi = Decimal('27582.81') # Approximate based on PMT
    assert abs(emi_data["emi"] - expected_emi) < Decimal('1.00')

def test_aggressive_repayment_savings():
    calc = LoanCalculator(
        loan_amount=Decimal('500000'),
        interest_rate=Decimal('10.0'),
        course_duration_years=0, # Immediate EMI for test
        family_income=Decimal('1000000')
    )
    # 5 years tenure = 60 months
    baseline = calc.get_full_schedule(tenure_years=5)
    # With 1 Extra EMI per year (5 extra EMIs total)
    accelerated = calc.get_full_schedule(tenure_years=5, extra_emi_per_year=1)
    
    assert len(accelerated) < len(baseline)
    
    total_int_baseline = sum(m["interest"] for m in baseline)
    total_int_accelerated = sum(m["interest"] for m in accelerated)
    assert total_int_accelerated < total_int_baseline
