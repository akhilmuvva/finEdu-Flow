import pytest
from decimal import Decimal
from app.services.calculator import LoanCalculator

def test_aaa_premium_interest():
    # AAA Category: Rate = 8.00% (6.5 + 1.5)
    # 2 years course + 1 year moratorium = 3 years
    # Simple Interest: 10,00,000 * 0.08 * 3 = 2,40,000
    calc = LoanCalculator(
        loan_amount=Decimal('1000000'),
        interest_rate=Decimal('8.00'),
        course_duration_years=2,
        family_income=Decimal('1000000'), # No subvention for this test
        is_qhei=True # AAA is QHEI
    )
    moratorium_int = calc.calculate_moratorium_interest()
    assert moratorium_int == Decimal('240000.00')

def test_aa_vidyalaxmi_subvention():
    # AA Category: Rate = 8.20% (6.5 + 1.7)
    # User eligible for Vidyalaxmi (Income <= 8L) -> 3% subvention
    # Effective Rate: 8.20% - 3% = 5.20%
    # Moratorium: 3 years
    # Simple Interest: 10,00,000 * 0.052 * 3 = 1,56,000
    calc = LoanCalculator(
        loan_amount=Decimal('1000000'),
        interest_rate=Decimal('8.20'),
        course_duration_years=2,
        family_income=Decimal('600000'),
        is_qhei=True
    )
    subv = calc.calculate_subventions()
    assert subv["vidyalaxmi_eligible"] is True
    assert subv["subvention_rate_reduction"] == Decimal('0.03')
    
    moratorium_int = calc.calculate_moratorium_interest()
    assert moratorium_int == Decimal('156000.00')

def test_csis_full_subvention_aaa():
    # CSIS: Income <= 4.5L -> Full interest subsidy
    calc = LoanCalculator(
        loan_amount=Decimal('1000000'),
        interest_rate=Decimal('8.00'),
        course_duration_years=2,
        family_income=Decimal('400000'),
        is_qhei=True
    )
    subv = calc.calculate_subventions()
    assert subv["csis_eligible"] is True
    assert calc.calculate_moratorium_interest() == Decimal('0.00')

def test_emi_capitalization_check():
    # AAA: 10L loan, 8% rate, 2yr course
    # Moratorium Int = 2.4L (Simple)
    # Total Principal = 12.4L
    calc = LoanCalculator(
        loan_amount=Decimal('1000000'),
        interest_rate=Decimal('8.00'),
        course_duration_years=2,
        family_income=Decimal('1000000'),
        is_qhei=True
    )
    emi_data = calc.calculate_emi(tenure_years=10)
    assert emi_data["capitalized_principal"] == Decimal('1240000.00')
    # PMT(0.08/12, 120, -1240000) approx 15044.59
    assert abs(emi_data["emi"] - Decimal('15044.59')) < Decimal('1.00')
