import requests

# Simulate an income certificate text file
doc_text = b"""
INCOME CERTIFICATE
This is to certify that the annual family income is Rs. 4,50,000 (Four Lakh Fifty Thousand Rupees)
Issued by: Village Officer
Valid for PM-Vidyalaxmi subvention application
"""

for doc_type, text in [
    ("income_certificate", b"Just some random text without any keywords."),
    ("co_applicant_kyc", b"Co-Applicant KYC\nName: Raju Sharma\nNo Aadhaar or PAN here."),
    ("entrance_scorecard", b"JEE Result\nQualified\nScore: 200"),
]:
    files = {"file": (f"test_{doc_type}.pdf", text, "application/pdf")}
    data = {"doc_type": doc_type}
    r = requests.post("http://localhost:8000/api/v1/verify-document", files=files, data=data)
    result = r.json()
    print(f"\n" + "="*50)
    print(f"DOC TYPE: {doc_type}")
    print(f"Status: {result['status']} | Confidence: {result['confidence']}%")
    print(f"Verdict: {result['ai_verdict']}")
    
    if result.get("rejection_action_plan"):
        print("\n--- REJECTION ACTION PLAN ---")
        for step in result["rejection_action_plan"]:
            print(f"#{step['step']} [{step['priority']}] {step['action']} ({step['agency']})")
