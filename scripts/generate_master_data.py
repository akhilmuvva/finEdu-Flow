import pandas as pd
import numpy as np
import os

def generate_master_data():
    # 1. Start with the "Real" Top Universities provided in the snippet
    real_data = [
        ["U-0248","IISc Bangalore","Karnataka","Deemed",1,True,"AAA",145000,18.5],
        ["U-0100","IIT Delhi","Delhi","Central",2,True,"AAA",1050000,22.0],
        ["U-0139","IIT Bombay","Maharashtra","Central",3,True,"AAA",950000,21.5],
        ["U-0319","JNU","Delhi","Central",4,True,"AA",1200,11.5],
        ["U-0745","University of Hyderabad","Telangana","Central",5,True,"AA",45000,9.8],
        ["U-0391","BITS Pilani","Rajasthan","Private",7,True,"AAA",2450000,20.5],
        ["U-0221","MAHE Manipal","Karnataka","Private",8,True,"AA",1850000,11.2],
        ["U-0108","Jamia Millia Islamia","Delhi","Central",9,True,"AA",48000,9.2],
        ["U-0480","VIT Vellore","Tamil Nadu","Private",10,True,"A",980000,9.5],
        ["U-0500","Banaras Hindu University","Uttar Pradesh","Central",11,True,"AA",35000,9.1],
        ["U-0111","Delhi University (DU)","Delhi","Central",12,True,"AA",65000,8.9],
        ["U-0439","Anna University","Tamil Nadu","State",13,True,"A",125000,8.5],
        ["U-0273","Savitribai Phule Pune University","Maharashtra","State",14,True,"A",95000,8.2],
        ["U-0558","Panjab University","Chandigarh","State",15,True,"A",115000,8.4],
        ["U-0012","ICFAI Hyderabad","Telangana","Private",16,True,"A",1250000,7.8],
        ["U-0584","IIEST Shibpur","West Bengal","Central",17,True,"AAA",750000,9.5],
        ["U-0688","AIIMS Bhubaneswar","Odisha","Central",18,True,"AAA",35000,15.5],
        ["U-0096","AIIMS Delhi","Delhi","Central",19,True,"AAA",42000,18.0],
        ["U-1016","IIM Ahmedabad","Gujarat","Central",1,True,"AAA",2800000,32.5],
        ["U-1014","IIM Bangalore","Karnataka","Central",2,True,"AAA",2650000,31.5],
        ["U-1012","IIM Indore","Madhya Pradesh","Central",20,True,"AAA",2100000,24.5],
        ["U-1008","IIM Lucknow","Uttar Pradesh","Central",21,True,"AAA",1950000,26.0],
        ["U-0701","IIT (BHU) Varanasi","Uttar Pradesh","Central",14,True,"AAA",1150000,19.5],
        ["U-0497","Amity University","Uttar Pradesh","Private",23,True,"A",1450000,7.2],
        ["U-0127","CEPT University","Gujarat","Private",24,True,"A",1650000,8.5],
    ]
    
    columns = ["aishe_code", "name", "state", "type", "nirf_2026", "is_qhei", "pmvl_category", "total_course_fee", "avg_placement_lpa"]
    df_real = pd.DataFrame(real_data, columns=columns)
    
    # 2. Generate Synthetic Data to reach 300+
    num_synthetic = 300
    popular_names = [
        "NIT Trichy", "NIT Surathkal", "SRM University", "Shiv Nadar University",
        "Amity University", "Christ University", "LPU", "Chandigarh University",
        "Kalinga Institute", "Thapar University", "Jaypee Institute", "Symbiosis International",
        "UPES Dehradun", "Jain University", "Reva University", "PES University"
    ]
    
    synthetic_data = {
        "aishe_code": [f"U-{i:04}" for i in range(2000, 2000 + num_synthetic)],
        "name": [np.random.choice(popular_names) + f" ({np.random.choice(['North','South','East','West','Main','Extension'])})" for _ in range(num_synthetic)],
        "state": np.random.choice(["Delhi", "Maharashtra", "Gujarat", "Rajasthan", "Karnataka", "Tamil Nadu", "Telangana", "West Bengal", "Uttar Pradesh", "Punjab"], num_synthetic),
        "type": np.random.choice(["Central", "Private", "State", "Deemed"], num_synthetic),
        "nirf_2026": np.random.randint(30, 500, num_synthetic),
    }
    
    df_syn = pd.DataFrame(synthetic_data)
    df_syn['is_qhei'] = df_syn['nirf_2026'] < 100
    df_syn['pmvl_category'] = np.where(df_syn['nirf_2026'] < 30, 'AAA', np.where(df_syn['nirf_2026'] < 150, 'AA', 'A'))
    df_syn['total_course_fee'] = np.where(df_syn['type'] == 'Central', np.random.randint(5000, 150000), np.random.randint(600000, 3000000))
    df_syn['avg_placement_lpa'] = np.where(df_syn['nirf_2026'] < 100, np.random.uniform(10, 25), np.random.uniform(3, 9))
    
    # Combined DF
    df_master = pd.concat([df_real, df_syn], ignore_index=True)
    
    # Calculate ROI Index (Placement LPA * 10^5 / Course Fee)
    df_master['roi_index'] = (df_master['avg_placement_lpa'] * 100000 / df_master['total_course_fee']).round(2)
    
    # Cap ROI Index for display aesthetics (0-10 scale)
    df_master['roi_index'] = np.where(df_master['roi_index'] > 10, 9.8, df_master['roi_index'])
    
    # Ensure directory exists
    output_path = os.path.join("app", "data", "universities_master_2026.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    df_master.to_csv(output_path, index=False)
    print(f"✅ Generated {len(df_master)} universities in {output_path}")

if __name__ == "__main__":
    generate_master_data()
