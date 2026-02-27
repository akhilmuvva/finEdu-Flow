"""
AI Document Verification Engine — finEduFlow 2026
Intelligently verifies student loan documents using keyword pattern analysis,
format validation, and policy rule-checking (PM-Vidyalaxmi / CSIS compliance).
"""
import re
import io
from typing import Dict, Any

# Attempt to use PyMuPDF for PDF text extraction; fallback to raw bytes scan
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False


# ── Document rule definitions ────────────────────────────────────────────────

DOC_RULES: Dict[str, Dict[str, Any]] = {
    "income_certificate": {
        "label": "Income Certificate",
        "required_keywords": ["income", "annual", "certificate", "rupees", "family"],
        "bonus_keywords": ["village officer", "tehsildar", "gazetted", "subvention", "pm-vidyalaxmi"],
        "format_checks": [],
        "policy_note": "Mandatory for PM-Vidyalaxmi 3% subvention if family income ≤ ₹8L/yr.",
    },
    "nirf_admission": {
        "label": "NIRF University Admission Letter",
        "required_keywords": ["admission", "university", "institute", "programme", "student"],
        "bonus_keywords": ["nirf", "ugc", "aicte", "naac", "accredited", "ranking"],
        "format_checks": ["date_pattern"],
        "policy_note": "Must be from a QHEI institution for loan sanction.",
    },
    "co_applicant_kyc": {
        "label": "Co-Applicant KYC",
        "required_keywords": ["name", "address", "pan", "aadhaar", "applicant"],
        "bonus_keywords": ["kyc", "identity", "verified", "co-borrower", "guarantor"],
        "format_checks": ["pan_format", "aadhaar_format"],
        "policy_note": "Aadhar + PAN must be linked for CKYC compliance.",
    },
    "entrance_scorecard": {
        "label": "Entrance Exam Scorecard",
        "required_keywords": ["score", "rank", "percentile", "result", "examination"],
        "bonus_keywords": ["jee", "cat", "gate", "neet", "clat", "xat", "cmat"],
        "format_checks": ["year_pattern"],
        "policy_note": "JEE/CAT/GATE/NEET validated scorecard required for NIRF-ranked institutions.",
    },
}

# ── Format validators ─────────────────────────────────────────────────────────

def _check_pan_format(text: str) -> bool:
    """PAN: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)"""
    return bool(re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text.upper()))

def _check_aadhaar_format(text: str) -> bool:
    """Aadhaar: 12-digit number, optionally space-separated"""
    return bool(re.search(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', text))

def _check_date_pattern(text: str) -> bool:
    return bool(re.search(r'\b(20\d{2}|19\d{2})\b', text))

def _check_year_pattern(text: str) -> bool:
    return bool(re.search(r'\b20(1\d|2[0-6])\b', text))

FORMAT_CHECKERS = {
    "pan_format":     _check_pan_format,
    "aadhaar_format": _check_aadhaar_format,
    "date_pattern":   _check_date_pattern,
    "year_pattern":   _check_year_pattern,
}

# ── Text Extraction ───────────────────────────────────────────────────────────

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract readable text from PDF or image file."""
    text = ""
    fname_lower = filename.lower()

    if fname_lower.endswith(".pdf") and HAS_PYMUPDF:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception:
            pass
    
    # Fallback: scan raw bytes for readable ASCII (works for text-PDFs and TXTs)
    if not text.strip():
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            text = file_bytes.decode("latin-1", errors="ignore")

    return text.lower()


# ── Rejection Remediation Database ───────────────────────────────────────────
# Per doc-type → per missing signal → list of action steps

REJECTION_REMEDIATION: Dict[str, Dict[str, list]] = {
    "income_certificate": {
        "income": [
            {"step": 1, "priority": "CRITICAL", "action": "Visit your local Tehsildar/Village Officer office and request an official Income Certificate", "agency": "Revenue Dept / Panchayat Office"},
            {"step": 2, "priority": "CRITICAL", "action": "Ensure certificate explicitly states 'Annual Family Income: ₹X,XX,XXX'", "agency": "Issuing Authority"},
            {"step": 3, "priority": "HIGH",     "action": "Get the certificate notarized with officer's rubber stamp and signature", "agency": "Notary / Gazetted Officer"},
        ],
        "annual": [
            {"step": 1, "priority": "HIGH",     "action": "Certificate must mention 'Annual' income — not monthly. Request officer to re-issue with correct format", "agency": "Revenue Department"},
        ],
        "certificate": [
            {"step": 1, "priority": "CRITICAL", "action": "Upload the official certificate document, not a salary slip or bank statement", "agency": "—"},
        ],
        "rupees": [
            {"step": 1, "priority": "HIGH",     "action": "Ensure income is mentioned in Indian Rupees (₹ / 'Rupees') — not in USD or other currency", "agency": "—"},
        ],
        "family": [
            {"step": 1, "priority": "HIGH",     "action": "The certificate must cover total FAMILY income, not individual. Request a Family Income Certificate specifically", "agency": "Tehsildar / BDO Office"},
        ],
        "_general": [
            {"step": "A", "priority": "INFO",  "action": "Download the official form: PM-Vidyalaxmi Income Certificate template from pmvidyalaxmi.co.in", "agency": "Ministry of Education"},
            {"step": "B", "priority": "INFO",  "action": "Alternative: Form 10D of IT Returns or Bank passbook + employer letter accepted at select branches", "agency": "Bank / NBFC"},
        ],
    },
    "nirf_admission": {
        "admission": [
            {"step": 1, "priority": "CRITICAL", "action": "Upload the official Admission Letter / Offer Letter issued by the university, not the application form", "agency": "University Admissions Office"},
            {"step": 2, "priority": "HIGH",     "action": "Letter must bear university letterhead, registrar signature, and official seal", "agency": "University Registrar"},
        ],
        "university": [
            {"step": 1, "priority": "CRITICAL", "action": "Only NIRF-ranked or UGC-recognized institutions qualify. Verify your institution at nirf.irins.org", "agency": "NIRF Portal"},
        ],
        "institute": [
            {"step": 1, "priority": "HIGH",     "action": "Upload the Institute-specific admission letter mentioning your programme details", "agency": "Institute Admin"},
        ],
        "programme": [
            {"step": 1, "priority": "HIGH",     "action": "Ensure the letter mentions programme name (B.Tech/MBA/MBBS) and duration explicitly", "agency": "Academic Office"},
        ],
        "student": [
            {"step": 1, "priority": "MEDIUM",   "action": "Admission letter must be addressed to the student — not a general notice. Request a personalized copy", "agency": "Admissions Cell"},
        ],
        "_general": [
            {"step": "A", "priority": "INFO",   "action": "Verify your university NIRF ranking at: nirf.irins.org/Home/GenerateRanking", "agency": "NIRF Portal"},
            {"step": "B", "priority": "INFO",   "action": "Alternative: UGC recognition certificate of the institution + enrollment proof accepted", "agency": "UGC / AICTE"},
        ],
    },
    "co_applicant_kyc": {
        "pan": [
            {"step": 1, "priority": "CRITICAL", "action": "Apply for PAN Card at incometax.gov.in/iec/foportal (takes 10-15 days). Instant e-PAN available via Aadhaar OTP", "agency": "NSDL / UTIITSL"},
            {"step": 2, "priority": "CRITICAL", "action": "Link PAN with Aadhaar at incometax.gov.in before uploading KYC", "agency": "Income Tax Department"},
        ],
        "aadhaar": [
            {"step": 1, "priority": "CRITICAL", "action": "Update Aadhaar at the nearest Aadhaar Seva Kendra if address has changed", "agency": "UIDAI / Aadhaar Centre"},
            {"step": 2, "priority": "HIGH",     "action": "Download e-Aadhaar from myaadhaar.uidai.gov.in — this is accepted by all banks", "agency": "UIDAI Portal"},
        ],
        "name": [
            {"step": 1, "priority": "HIGH",     "action": "KYC must display legal name matching bank records. Upload Aadhaar, Passport, or Voter ID", "agency": "—"},
        ],
        "address": [
            {"step": 1, "priority": "HIGH",     "action": "Current address proof required: utility bill (<3 months), rent agreement, or Aadhaar with current address", "agency": "—"},
        ],
        "applicant": [
            {"step": 1, "priority": "CRITICAL", "action": "KYC must explicitly identify the CO-APPLICANT (parent/guardian). Joint KYC or separate co-applicant form needed", "agency": "Bank Branch"},
        ],
        "_format_pan": [
            {"step": 1, "priority": "CRITICAL", "action": "PAN number format must be 10 characters: AAAAA9999A (5 alpha + 4 digits + 1 alpha). Verify at incometax.gov.in", "agency": "Income Tax Portal"},
        ],
        "_format_aadhaar": [
            {"step": 1, "priority": "CRITICAL", "action": "Aadhaar must be 12 digits. Masked Aadhaar (XXXX XXXX 1234) is also accepted — download from uidai.gov.in", "agency": "UIDAI"},
        ],
        "_general": [
            {"step": "A", "priority": "INFO",   "action": "CKYC registered applicants: Upload CKYC Number instead. Lookup at ckycindia.in", "agency": "CKYC Registry"},
            {"step": "B", "priority": "INFO",   "action": "Video KYC is available at HDFC, SBI, and Axis Bank — complete in 10 minutes via app", "agency": "Bank App"},
        ],
    },
    "entrance_scorecard": {
        "score": [
            {"step": 1, "priority": "CRITICAL", "action": "Upload the official scorecard PDF downloaded from the exam portal (NTA/IIM/GATE official site)", "agency": "NTA / GATE / IIM"},
            {"step": 2, "priority": "HIGH",     "action": "Score must be mentioned numerically on the document — screenshot or photo may be rejected", "agency": "—"},
        ],
        "rank": [
            {"step": 1, "priority": "HIGH",     "action": "For JEE: Download rank card from jeemain.nta.nic.in. For GATE: gate.iitk.ac.in. For CAT: iimcat.ac.in", "agency": "Exam Portal"},
        ],
        "percentile": [
            {"step": 1, "priority": "MEDIUM",   "action": "Percentile score must appear on the scorecard. Re-download from the official exam result portal", "agency": "Exam Authority"},
        ],
        "result": [
            {"step": 1, "priority": "HIGH",     "action": "Upload the RESULT / SCORECARD document — not the admit card or hall ticket", "agency": "—"},
        ],
        "examination": [
            {"step": 1, "priority": "HIGH",     "action": "Document must mention the exam name (JEE Main / JEE Advanced / GATE / CAT / NEET) explicitly", "agency": "—"},
        ],
        "_general": [
            {"step": "A", "priority": "INFO",   "action": "Accepted exams by lenders: JEE Main/Advanced, GATE, CAT, NEET, CLAT, XAT, CMAT, SNAP, MAT", "agency": "Bank Policy"},
            {"step": "B", "priority": "INFO",   "action": "If exam portal is down, contact your institution for a certified copy of your scorecard", "agency": "University Registrar"},
            {"step": "C", "priority": "INFO",   "action": "International exams: GRE/GMAT scores accepted for foreign university loans — upload ETS/GMAC report", "agency": "ETS / GMAC"},
        ],
    },
}


def _build_rejection_action_plan(doc_type: str, missing: list, format_issues: list) -> list:
    """
    Generate a tailored action plan based on what's missing in the document.
    Returns a list of prioritized action steps.
    """
    remediation = REJECTION_REMEDIATION.get(doc_type, {})
    plan = []
    seen_steps = set()

    # Add per-missing-signal steps
    for signal in missing:
        steps = remediation.get(signal, [])
        for step in steps:
            key = f"{signal}_{step['step']}"
            if key not in seen_steps:
                plan.append({**step, "reason": f"Missing: '{signal}'"})
                seen_steps.add(key)

    # Add format-specific steps
    for issue in format_issues:
        fmt_key = f"_format_{issue.lower().replace(' ', '_')}"
        steps = remediation.get(fmt_key, [])
        for step in steps:
            key = f"fmt_{fmt_key}_{step['step']}"
            if key not in seen_steps:
                plan.append({**step, "reason": f"Format issue: {issue}"})
                seen_steps.add(key)

    # Always append general tips
    for step in remediation.get("_general", []):
        key = f"_gen_{step['step']}"
        if key not in seen_steps:
            plan.append({**step, "reason": "General guidance"})
            seen_steps.add(key)

    return plan


# ── Core Verification Engine ──────────────────────────────────────────────────

def verify_document(file_bytes: bytes, filename: str, doc_type: str) -> Dict[str, Any]:
    """
    AI Document Verifier with Rejection Remediation.
    Returns a structured result including:
      - verified, confidence, status
      - found_signals, missing_signals, format_issues
      - ai_verdict, policy_note
      - rejection_action_plan: step-by-step remediation if REJECTED or PARTIAL
    """
    rules = DOC_RULES.get(doc_type)
    if not rules:
        return {
            "verified": False,
            "confidence": 0,
            "status": "REJECTED",
            "ai_verdict": f"Unknown document type: {doc_type}",
            "found_signals": [],
            "missing_signals": [],
            "format_issues": [],
            "policy_note": "",
            "rejection_action_plan": [],
            "doc_label": "Unknown",
        }

    text = extract_text(file_bytes, filename)

    required   = rules["required_keywords"]
    bonus      = rules["bonus_keywords"]
    fmt_checks = rules["format_checks"]

    found_required = [kw for kw in required if kw in text]
    found_bonus    = [kw for kw in bonus    if kw in text]
    missing        = [kw for kw in required if kw not in text]

    # Format checks
    format_issues = []
    for check_name in fmt_checks:
        checker = FORMAT_CHECKERS.get(check_name)
        if checker and not checker(text):
            format_issues.append(check_name.replace("_", " ").title())

    # Confidence scoring
    req_score        = (len(found_required) / max(len(required), 1)) * 60
    bonus_score      = min(len(found_bonus) * 8, 30)
    fmt_penalty      = len(format_issues) * 5
    file_type_bonus  = 5 if filename.lower().endswith((".pdf", ".jpg", ".jpeg", ".png")) else 0

    confidence = min(100, max(0, int(req_score + bonus_score + file_type_bonus - fmt_penalty)))

    # Status
    if confidence >= 70:
        status, verified = "VERIFIED", True
    elif confidence >= 40:
        status, verified = "PARTIAL", False
    else:
        status, verified = "REJECTED", False

    # AI Verdict narrative
    if status == "VERIFIED":
        verdict = (
            f"✅ Document appears valid. "
            f"Matched {len(found_required)}/{len(required)} required signals "
            f"and {len(found_bonus)} policy indicators. "
            f"{'No format issues.' if not format_issues else 'Minor notes: ' + ', '.join(format_issues) + '.'}"
        )
    elif status == "PARTIAL":
        verdict = (
            f"⚠️ Partial match ({confidence}% confidence). "
            f"Missing keywords: {', '.join(missing[:3])}. "
            f"Ensure the document is complete and not redacted. "
            f"{'Format issues: ' + ', '.join(format_issues) + '.' if format_issues else ''}"
            f" Follow the action plan below to rectify."
        )
    else:
        verdict = (
            f"❌ Verification failed ({confidence}% confidence). "
            f"Required signals not found: {', '.join(missing)}. "
            f"Please upload the correct document — accepted formats: PDF, JPG, PNG. "
            f"Follow the action plan below to obtain the correct documents."
        )

    # Build rejection action plan for PARTIAL and REJECTED
    rejection_action_plan = []
    if status in ("REJECTED", "PARTIAL"):
        rejection_action_plan = _build_rejection_action_plan(doc_type, missing, format_issues)

    return {
        "verified":              verified,
        "confidence":            confidence,
        "status":                status,
        "found_signals":         found_required + found_bonus,
        "missing_signals":       missing,
        "format_issues":         format_issues,
        "ai_verdict":            verdict,
        "policy_note":           rules["policy_note"],
        "rejection_action_plan": rejection_action_plan,
        "doc_label":             rules["label"],
    }
