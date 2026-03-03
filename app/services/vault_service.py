from sqlalchemy.orm import Session
from app import models
from decimal import Decimal
import datetime
from typing import Optional

PLATFORM_FEE = Decimal("999.00") # Annual Fee

class VaultService:
    @staticmethod
    def get_or_create_vault(db: Session, user_id: int) -> models.Vault:
        vault = db.query(models.Vault).filter(models.Vault.user_id == user_id).first()
        if not vault:
            vault = models.Vault(user_id=user_id, balance=Decimal("0.00"))
            db.add(vault)
            db.commit()
            db.refresh(vault)
        return vault

    @staticmethod
    def deposit(db: Session, user_id: int, amount: Decimal, razorpay_payment_id: str):
        """Simulate a deposit via Razorpay"""
        vault = VaultService.get_or_create_vault(db, user_id)
        vault.balance += amount
        
        transaction = models.VaultTransaction(
            vault_id=vault.id,
            amount=amount,
            type="DEPOSIT",
            description=f"Deposit via Razorpay (ID: {razorpay_payment_id})"
        )
        db.add(transaction)
        db.commit()
        db.refresh(vault)
        return vault

    @staticmethod
    def process_automated_deductions(db: Session):
        """Logic for Cron: Deducts Fees and pays EMIs"""
        vaults = db.query(models.Vault).all()
        now = datetime.datetime.utcnow()
        
        for vault in vaults:
            # 1. Annual Platform Fee Deduction
            if not vault.last_fee_deduction or (now - vault.last_fee_deduction).days >= 365:
                if vault.balance >= PLATFORM_FEE:
                    vault.balance -= PLATFORM_FEE
                    vault.last_fee_deduction = now
                    transaction = models.VaultTransaction(
                        vault_id=vault.id,
                        amount=-PLATFORM_FEE,
                        type="PLATFORM_FEE",
                        description="Annual Platform Fee (AI, Maps, Calendar Sync)"
                    )
                    db.add(transaction)
            
            # 2. Monthly EMI Payout (Simplified Logic)
            # In a real app, we'd check the current loan's emi. 
            # For this MVP, we simulate a payout if a loan exists.
            loan = db.query(models.Loan).filter(models.Loan.user_id == vault.user_id, models.Loan.status == "active").first()
            if loan:
                # Assuming dynamic EMI from simulation logic, but here we'll use a placeholder or derived value
                # For demo purposes, let's say ₹10,000
                dummy_emi = Decimal("10000.00")
                if vault.balance >= dummy_emi:
                    vault.balance -= dummy_emi
                    transaction = models.VaultTransaction(
                        vault_id=vault.id,
                        amount=-dummy_emi,
                        type="EMI_PAYOUT",
                        description="Automated Monthly EMI Payout to Bank"
                    )
                    db.add(transaction)
        
        db.commit()

    @staticmethod
    def get_stress_status(vault_balance: Decimal, emi: Decimal) -> str:
        """
        ML integration logic: 
        If balance >= 3 months of EMI, status is 'Optimal/Green'.
        """
        if emi > 0 and vault_balance >= (emi * 3):
            return "Optimal (Vault Secured)"
        elif emi > 0 and vault_balance >= emi:
            return "Stable"
        return "High (Replenish Vault)"
