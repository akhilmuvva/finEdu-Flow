import csv
import random
from decimal import Decimal

def generate_master_csv(count=1000):
    states = ["Delhi", "Maharashtra", "Tamil Nadu", "Karnataka", "Telangana", "Uttar Pradesh", "West Bengal", "Gujarat", "Rajasthan", "Punjab"]
    types = ["Central", "State", "Private", "Deemed"]
    institutions = ["Institute of Technology", "University", "College of Engineering", "Management Institute", "Medical College"]
    prefixes = ["National", "Indian", "Global", "Imperial", "Savitribai", "Jawaharlal", "Ambedkar"]
    
    with open("app/data/universities_master_2026.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["aishe_code", "name", "state", "type", "nirf_2026", "is_qhei", "pmvl_category", "total_course_fee", "avg_placement_lpa", "roi_index"])
        
        for i in range(1, count + 1):
            code = f"U-{1000 + i}"
            name = f"{random.choice(prefixes)} {random.choice(institutions)} {i}"
            state = random.choice(states)
            u_type = random.choice(types)
            rank = i
            is_qhei = rank <= 100 or (u_type == "State" and rank <= 200) or u_type == "Central"
            
            if rank <= 50:
                cat = "AAA"
                fee = random.randint(1000000, 2500000)
                placement = random.uniform(15, 30)
            elif rank <= 150:
                cat = "AA"
                fee = random.randint(500000, 1500000)
                placement = random.uniform(8, 15)
            else:
                cat = "A"
                fee = random.randint(100000, 800000)
                placement = random.uniform(4, 10)
            
            roi = (placement * 100000) / (fee or 1)
            # Normalizing ROI to index 1-10
            roi_index = min(9.9, max(1.0, roi * 5)) 

            writer.writerow([code, name, state, u_type, rank, is_qhei, cat, fee, round(placement, 2), round(roi_index, 1)])

    print(f"✅ Generated Master CSV with {count} Universities.")

if __name__ == "__main__":
    generate_master_csv()
