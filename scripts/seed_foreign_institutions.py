from decimal import Decimal
from app.database import SessionLocal, engine
from app import models

def seed_foreign_institutions():
    db = SessionLocal()
    # Ensuring tables exist
    models.Base.metadata.create_all(bind=engine)
    
    foreign_data = [
        {"name": "Stanford University", "country": "US", "currency": "USD", "avg_tuition": 62000, "ranking": 5},
        {"name": "Harvard University", "country": "US", "currency": "USD", "avg_tuition": 59000, "ranking": 4},
        {"name": "MIT", "country": "US", "currency": "USD", "avg_tuition": 60000, "ranking": 1},
        {"name": "University of Oxford", "country": "UK", "currency": "GBP", "avg_tuition": 38000, "ranking": 3},
        {"name": "University of Cambridge", "country": "UK", "currency": "GBP", "avg_tuition": 40000, "ranking": 2},
        {"name": "University of Toronto", "country": "Canada", "currency": "CAD", "avg_tuition": 45000, "ranking": 21},
        {"name": "McGill University", "country": "Canada", "currency": "CAD", "avg_tuition": 42000, "ranking": 30},
        {"name": "Technical University of Munich", "country": "Germany", "currency": "EUR", "avg_tuition": 0, "ranking": 37},
        {"name": "Heidelberg University", "country": "Germany", "currency": "EUR", "avg_tuition": 3000, "ranking": 87},
    ]

    try:
        for item in foreign_data:
            existing = db.query(models.ForeignInstitution).filter(models.ForeignInstitution.name == item['name']).first()
            if not existing:
                inst = models.ForeignInstitution(
                    name=item['name'],
                    country=item['country'],
                    currency=item['currency'],
                    avg_tuition_annual=Decimal(str(item['avg_tuition'])),
                    ranking_qs=item['ranking'],
                    is_top_world=item['ranking'] <= 100
                )
                db.add(inst)
        db.commit()
        print("✅ Foreign Institutions seeded (US, UK, Canada, Germany).")
    except Exception as e:
        print(f"❌ Error seeding foreign: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_foreign_institutions()
