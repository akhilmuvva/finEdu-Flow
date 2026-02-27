import numpy_financial as npf
from datetime import datetime, date

class LoanCalculator:
    def __init__(self, loan_amount: float, interest_rate: float, course_duration_years: int, family_income: float):
        self.loan_amount = loan_amount
        self.annual_rate = interest_rate / 100
        self.monthly_rate = self.annual_rate / 12
        self.course_duration_years = course_duration_years
        self.moratorium_years = course_duration_years + 1
        self.family_income = family_income

    def calculate_subventions(self):
        """
        PM-Vidyalaxmi: 3% subvention for income <= 8L (up to 10L loan)
        CSIS: Full subvention for income <= 4.5L
        """
        is_csis_eligible = self.family_income <= 450000
        is_vidyalaxmi_eligible = not is_csis_eligible and self.family_income <= 800000 and self.loan_amount <= 1000000
        
        return {
            "csis_eligible": is_csis_eligible,
            "vidyalaxmi_eligible": is_vidyalaxmi_eligible,
            "subvention_rate_reduction": 0.03 if is_vidyalaxmi_eligible else 0.0
        }

    def calculate_moratorium_interest(self):
        """
        RBI Guidelines: Simple Interest for Moratorium (Course + 1 year).
        If CSIS eligible, interest is paid by Govt.
        If PM-Vidyalaxmi eligible, rate is reduced by 3%.
        """
        subv = self.calculate_subventions()
        effective_rate = self.annual_rate
        
        if subv["csis_eligible"]:
            return 0.0 # Govt pays full interest
        
        if subv["vidyalaxmi_eligible"]:
            effective_rate -= 0.03
            
        # Simple Interest = P * R * T
        moratorium_interest = self.loan_amount * effective_rate * self.moratorium_years
        return moratorium_interest

    def calculate_emi(self, tenure_years: int):
        """
        Compounding EMI after moratorium.
        Principal for EMI = Original Loan + Moratorium Interest (if not subsidized)
        """
        moratorium_interest = self.calculate_moratorium_interest()
        total_principal = self.loan_amount + moratorium_interest
        
        monthly_tenure = tenure_years * 12
        emi = npf.pmt(self.monthly_rate, monthly_tenure, -total_principal)
        return emi, total_principal

    def calculate_80E_benefit(self, emi: float, total_principal: float, tenure_years: int, tax_slab: float = 0.3):
        """
        Section 80E: Deduction on interest paid for max 8 years.
        """
        benefit_years = min(8, tenure_years)
        monthly_rate = self.monthly_rate
        remaining_principal = total_principal
        total_interest_8_years = 0
        
        for _ in range(benefit_years * 12):
            interest_component = remaining_principal * monthly_rate
            principal_component = emi - interest_component
            total_interest_8_years += interest_component
            remaining_principal -= principal_component
            
        return total_interest_8_years * tax_slab

    def simulate_aggressive_repayment(self, emi: float, total_principal: float, tenure_years: int, extra_emi_per_year: int = 1):
        """
        /clear-fast simulation: Pay extra EMI(s) per year.
        """
        remaining_balance = total_principal
        months = 0
        total_paid = 0
        
        while remaining_balance > 0 and months < 500: # Safety cap
            months += 1
            interest = remaining_balance * self.monthly_rate
            principal_paid = emi - interest
            
            # Apply extra EMI logic (e.g., at end of every 12 months)
            if months % 12 == 0:
                principal_paid += emi * extra_emi_per_year
                
            remaining_balance -= principal_paid
            total_paid += (emi + (emi * extra_emi_per_year if months % 12 == 0 else 0))
            
            if remaining_balance < 0:
                total_paid += remaining_balance # Adjust for overpayment
                remaining_balance = 0
                
        return {
            "original_months": tenure_years * 12,
            "accelerated_months": months,
            "months_saved": (tenure_years * 12) - months,
            "total_interest_paid": total_paid - total_principal
        }
