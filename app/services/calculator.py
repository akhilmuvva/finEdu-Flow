from decimal import Decimal, ROUND_HALF_UP
import numpy_financial as npf
from typing import Dict, List, Any

class LoanCalculator:
    def __init__(
        self, 
        loan_amount: Decimal, 
        interest_rate: Decimal, 
        course_duration_years: int, 
        family_income: Decimal
    ):
        self.loan_amount = loan_amount
        # Convert annual interest rate to monthly decimal
        self.annual_rate = interest_rate / Decimal('100')
        self.monthly_rate = self.annual_rate / Decimal('12')
        self.course_duration_years = course_duration_years
        self.moratorium_years = course_duration_years + 1
        self.family_income = family_income

    def _round(self, value: Decimal) -> Decimal:
        """Standard financial rounding to 2 decimal places."""
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def calculate_subventions(self) -> Dict[str, Any]:
        """
        Compliance Check (2026):
        - CSIS: Family Income <= 4.5L (Full subsidy during moratorium).
        - PM-Vidyalaxmi: Family Income <= 8L AND Loan <= 10L (3% subvention).
        """
        is_csis_eligible = self.family_income <= Decimal('450000')
        is_vidyalaxmi_eligible = (
            not is_csis_eligible and 
            self.family_income <= Decimal('800000') and 
            self.loan_amount <= Decimal('1000000')
        )
        
        return {
            "csis_eligible": is_csis_eligible,
            "vidyalaxmi_eligible": is_vidyalaxmi_eligible,
            "subvention_rate_reduction": Decimal('0.03') if is_vidyalaxmi_eligible else Decimal('0.00'),
            "label": "CSIS (Full)" if is_csis_eligible else ("PM-Vidyalaxmi (3%)" if is_vidyalaxmi_eligible else "General")
        }

    def calculate_moratorium_interest(self) -> Decimal:
        """
        RBI 2026 Guidelines: Simple Interest for Moratorium.
        """
        subv = self.calculate_subventions()
        if subv["csis_eligible"]:
            return Decimal('0.00') # Govt pays full interest
            
        effective_annual_rate = self.annual_rate
        if subv["vidyalaxmi_eligible"]:
            effective_annual_rate -= Decimal('0.03')
            
        # P * R * T (Simple Interest)
        interest = self.loan_amount * effective_annual_rate * Decimal(str(self.moratorium_years))
        return self._round(interest)

    def calculate_emi(self, tenure_years: int) -> Dict[str, Decimal]:
        """
        Post-moratorium Compounding EMI.
        """
        moratorium_interest = self.calculate_moratorium_interest()
        total_principal = self.loan_amount + moratorium_interest
        
        n_periods = tenure_years * 12
        
        # npf.pmt returns float, we convert back to Decimal for precision
        emi_float = npf.pmt(float(self.monthly_rate), n_periods, -float(total_principal))
        
        return {
            "emi": self._round(Decimal(str(emi_float))),
            "capitalized_principal": self._round(total_principal)
        }

    def get_full_schedule(
        self, 
        tenure_years: int, 
        extra_emi_per_year: int = 0,
        monthly_top_up: Decimal = Decimal('0.00'),
        annual_lumpsum: Decimal = Decimal('0.00')
    ) -> List[Dict[str, Any]]:
        """
        Generates a Recharts-ready monthly schedule with multiple aggressive strategies.
        """
        emi_data = self.calculate_emi(tenure_years)
        base_emi = emi_data["emi"]
        balance = emi_data["capitalized_principal"]
        
        schedule = []
        total_months = tenure_years * 12
        
        for month in range(1, total_months + 1):
            interest_payment = self._round(balance * self.monthly_rate)
            # Standard EMI + Monthly Top-up
            principal_payment = (base_emi + monthly_top_up) - interest_payment
            
            # Implementation of "Clear-Fast" extra EMI logic
            if extra_emi_per_year > 0 and month % 12 == 0:
                extra_payment = base_emi * Decimal(str(extra_emi_per_year))
                principal_payment += extra_payment
            
            # Annual Lumpsum
            if annual_lumpsum > 0 and month % 12 == 0:
                principal_payment += annual_lumpsum
            
            if principal_payment > balance:
                principal_payment = balance
                
            balance -= principal_payment
            
            schedule.append({
                "month": month,
                "interest": float(interest_payment),
                "principal": float(principal_payment),
                "remaining_balance": float(self._round(balance)),
                "total_repaid": float(self._round(base_emi + monthly_top_up)) # Base cost track
            })
            
            if balance <= 0:
                break
                
        return schedule

    def calculate_80E_benefit(self, schedule: List[Dict[str, Any]], tax_slab: Decimal = Decimal('0.30')) -> Decimal:
        """
        Section 80E: Deduction on actual interest paid for max 8 years.
        """
        total_interest_paid_8y = Decimal('0')
        months_to_track = min(96, len(schedule)) # 8 years = 96 months
        
        for i in range(months_to_track):
            total_interest_paid_8y += Decimal(str(schedule[i]["interest"]))
            
        return self._round(total_interest_paid_8y * tax_slab)
