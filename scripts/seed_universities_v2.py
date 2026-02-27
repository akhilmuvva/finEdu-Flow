import pandas as pd
import io
import os
from decimal import Decimal
from app.database import SessionLocal, engine
from app import models

# Interest Rate Logic for 2026 (Benchmark: Repo @ 6.5%)
REPO_RATE = 6.50

def calculate_base_rate(category):
    """Maps PM-Vidyalaxmi categories to Bank Interest Spreads"""
    mapping = {
        "AAA": REPO_RATE + 1.50, # 8.00%
        "AA": REPO_RATE + 1.70,  # 8.20%
        "A": REPO_RATE + 2.50,   # 9.00% (Standard RLLR)
    }
    return mapping.get(category, 10.50) # Default for unlisted

def seed_universities():
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    
    # Load the Master CSV 2026
    csv_path = os.path.join("app", "data", "universities_master_2026.csv")
    df = pd.read_csv(csv_path)
    db = SessionLocal()

    try:
        for _, row in df.iterrows():
            # Check for existing
            existing = db.query(models.University).filter(models.University.aishe_code == row['aishe_code']).first()
            
            if existing:
                # Update existing
                existing.name = row['name']
                existing.state = row['state']
                existing.type = row['type']
                existing.nirf_2026 = row['nirf_2026']
                existing.is_qhei = row['is_qhei']
                existing.pmvl_category = row['pmvl_category']
                existing.total_course_fee = Decimal(str(row['total_course_fee']))
                existing.avg_placement_lpa = Decimal(str(row['avg_placement_lpa']))
                existing.roi_index = row['roi_index']
                existing.base_interest_rate = calculate_base_rate(row['pmvl_category'])
            else:
                # Add new
                university = models.University(
                    aishe_code=row['aishe_code'],
                    name=row['name'],
                    state=row['state'],
                    type=row['type'],
                    nirf_2026=row['nirf_2026'],
                    is_qhei=row['is_qhei'],
                    pmvl_category=row['pmvl_category'],
                    total_course_fee=Decimal(str(row['total_course_fee'])),
                    avg_placement_lpa=Decimal(str(row['avg_placement_lpa'])),
                    roi_index=row['roi_index'],
                    base_interest_rate=calculate_base_rate(row['pmvl_category'])
                )
                db.add(university)
        
        db.commit()
        print("✅ Database successfully seeded with 2026 University Data!")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_universities()
