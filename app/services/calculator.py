from decimal import Decimal, ROUND_HALF_UP
import numpy_financial as npf
from typing import Dict, List, Any

class LoanCalculator:
    def __init__(
        self, 
        loan_amount: Decimal, 
        interest_rate: Decimal, 
        course_duration_years: int, 
        family_income: Decimal,
        is_qhei: bool = False,
        currency: str = "INR",
        forex_rate: Decimal = Decimal('1.00')
    ):
        # Data Engineer Mandate: Convert foreign tuition to INR immediately
        self.loan_amount_inr = loan_amount * forex_rate
        self.original_loan_amount = loan_amount
        self.currency = currency
        self.forex_rate = forex_rate
        
        # Data Engineer Mandate: RLLR benchmarking (6.5% base)
        self.rllr_benchmark = Decimal('6.50')
        self.annual_rate = interest_rate / Decimal('100')
        self.monthly_rate = self.annual_rate / Decimal('12')
        self.course_duration_years = course_duration_years
        self.moratorium_years = course_duration_years + 1
        self.family_income = family_income
        self.is_qhei = is_qhei

    def _round(self, value: Decimal) -> Decimal:
        """Standard financial rounding to 2 decimal places."""
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def calculate_subventions(self) -> Dict[str, Any]:
        """
        The 2026 Subsidy Engine:
        - Tier 1: Income < 4.5L -> 100% CSIS (Full subsidy during moratorium).
        - Tier 2: Income < 8L -> 3.00% PM-Vidyalaxmi Subvention.
        """
        is_csis_eligible = self.family_income < Decimal('450000')
        is_vidyalaxmi_eligible = self.is_qhei and self.family_income < Decimal('800000')
        
        return {
            "csis_eligible": is_csis_eligible,
            "vidyalaxmi_eligible": is_vidyalaxmi_eligible,
            "subvention_rate_reduction": Decimal('0.03') if is_vidyalaxmi_eligible else Decimal('0.00'),
            "label": "Tier 1: 100% CSIS" if is_csis_eligible else ("Tier 2: 3% PMVL" if is_vidyalaxmi_eligible else "Standard")
        }

    def determine_tcs(self, self_funded_amount: Decimal = Decimal('0')) -> Dict[str, Any]:
        """
        2026 TCS Rules:
        - 0% on loan-funded remittances.
        - 2% on self-funded > 10L.
        """
        tcs_amount = Decimal('0')
        details = "Loan Funded: 0% TCS applied."
        
        if self_funded_amount > Decimal('1000000'):
            tcs_amount = (self_funded_amount - Decimal('1000000')) * Decimal('0.02')
            details = f"Self-Funded (>10L): 2% TCS on excess. Total: {tcs_amount}"
            
        return {
            "amount": self._round(tcs_amount),
            "details": details
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
        interest = self.loan_amount_inr * effective_annual_rate * Decimal(str(self.moratorium_years))
        return self._round(interest)

    def calculate_emi(self, tenure_years: int) -> Dict[str, Decimal]:
        """
        Post-moratorium Compounding EMI.
        """
        moratorium_interest = self.calculate_moratorium_interest()
        total_principal = self.loan_amount_inr + moratorium_interest
        
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

    def calculate_opportunity_cost(
        self, 
        extra_monthly: Decimal, 
        investment_roi: Decimal = Decimal('12.0')
    ) -> Dict[str, Any]:
        """
        Hackathon Special: Investment vs Repayment Advisor.
        Compares the benefit of paying off the loan early vs investing that same extra amount in a 12% ROI SIP.
        """
        annual_inv_rate = investment_roi / Decimal('100')
        monthly_inv_rate = annual_inv_rate / Decimal('12')
        
        # Scenario 1: Interest Saved by paying loan
        loan_sched = self.get_full_schedule(tenure_years=10, monthly_top_up=extra_monthly)
        baseline = self.get_full_schedule(tenure_years=10)
        
        interest_saved = sum(Decimal(str(m["interest"])) for m in baseline) - sum(Decimal(str(m["interest"])) for m in loan_sched)
        months_saved = len(baseline) - len(loan_sched)
        
        # Scenario 2: Wealth Built by investing the same amount for the same duration
        total_months = len(baseline)
        future_value = Decimal('0')
        for _ in range(total_months):
            future_value = (future_value + extra_monthly) * (Decimal('1') + monthly_inv_rate)
            
        total_invested = extra_monthly * Decimal(str(total_months))
        wealth_gained = future_value - total_invested
        
        advice = "Repay Early" if interest_saved > wealth_gained else "Invest Extra in SIP"
        
        return {
            "interest_saved_by_repayment": float(self._round(interest_saved)),
            "wealth_gained_by_investing": float(self._round(wealth_gained)),
            "months_saved": months_saved,
            "optimal_strategy": advice,
            "roi_comparison_ratio": float(self._round(interest_saved / wealth_gained if wealth_gained > 0 else Decimal('0')))
        }
