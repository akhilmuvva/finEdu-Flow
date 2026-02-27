import httpx
import asyncio
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

# Target rate for Feb 2026 Hackathon Demo
TARGET_USD_INR = Decimal('91.00')

class ForexService:
    @staticmethod
    async def fetch_current_rates():
        # In a real app, this would call an API like ExchangeRate-API or OER
        # For the 2026 Hackathon, we simulate the predicted volatility
        return {
            "USD": TARGET_USD_INR,
            "GBP": Decimal('115.40'),
            "EUR": Decimal('98.20'),
            "CAD": Decimal('67.50')
        }

    @staticmethod
    async def update_cached_rates(db: Session):
        rates = await ForexService.fetch_current_rates()
        for curr, rate in rates.items():
            existing = db.query(models.ForexRate).filter(models.ForexRate.base_currency == curr).first()
            if existing:
                existing.rate = rate
                existing.updated_at = datetime.utcnow()
            else:
                new_rate = models.ForexRate(
                    base_currency=curr,
                    target_currency="INR",
                    rate=rate
                )
                db.add(new_rate)
        db.commit()
        print(f"[{datetime.utcnow()}] Forex Rates Updated for 2026 Market Dynamics.")

    @staticmethod
    def get_rate(db: Session, base: str = "USD"):
        rate_entry = db.query(models.ForexRate).filter(models.ForexRate.base_currency == base).first()
        return rate_entry.rate if rate_entry else TARGET_USD_INR
