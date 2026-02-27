import pandas as pd
import io
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
    
    # Load the CSV data we generated
    csv_data = """aishe_code,name,state,type,nirf_2026,is_qhei,pmvl_category,total_course_fee,avg_placement_lpa,roi_index
U-0248,Indian Institute of Science (IISc),Karnataka,Deemed,1,True,AAA,145000,18.50,9.80
U-0100,Indian Institute of Technology (IIT) Delhi,Delhi,Central,2,True,AAA,1050000,22.00,9.20
U-0319,Jawaharlal Nehru University (JNU),Delhi,Central,3,True,AA,1200,11.50,9.90
U-0745,University of Hyderabad,Telangana,Central,4,True,AA,45000,9.80,9.40
U-0391,BITS Pilani,Rajasthan,Private,7,True,AAA,2450000,20.50,8.50
U-0221,Manipal Academy of Higher Education (MAHE),Karnataka,Private,4,True,AA,1850000,11.20,7.10
U-0108,Jamia Millia Islamia,Delhi,Central,5,True,AA,48000,9.20,9.30
U-0480,Vellore Institute of Technology (VIT),Tamil Nadu,Private,11,True,A,980000,9.50,7.80
U-0558,Panjab University,Chandigarh,State,12,True,A,115000,8.40,8.60
U-0012,ICFAI Foundation for Higher Education,Telangana,Private,18,True,A,1250000,7.80,6.50
U-0584,IIEST Shibpur,West Bengal,Central,20,True,AAA,750000,9.50,8.40"""

    df = pd.read_csv(io.StringIO(csv_data))
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
