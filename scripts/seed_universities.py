import csv
import os
from decimal import Decimal
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def seed_universities():
    csv_path = os.path.join("app", "data", "universities_2026.csv")
    db = SessionLocal()
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Check for existing
                existing = db.query(models.University).filter(models.University.aishe_code == row['aishe_code']).first()
                if existing:
                    continue
                
                univ = models.University(
                    aishe_code=row['aishe_code'],
                    name=row['name'],
                    state=row['state'],
                    type=row['type'],
                    is_qhei=row['is_qhei'].lower() == 'true',
                    nirf_rank=int(row['nirf_rank']),
                    avg_total_fees_inr=Decimal(row['avg_total_fees_inr']),
                    avg_placement_lpa=Decimal(row['avg_placement_lpa']),
                    roi_score=Decimal(row['roi_score'])
                )
                db.add(univ)
        db.commit()
        print("Universities seeded successfully from CSV.")
    except Exception as e:
        print(f"Error seeding universities: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_universities()
