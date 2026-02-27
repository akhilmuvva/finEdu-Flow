from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO
from decimal import Decimal
from typing import Dict, Any, List

class PDFReportProvider:
    @staticmethod
    def generate_loan_projection(
        user_name: str,
        loan_details: Dict[str, Any],
        repayment_summary: Dict[str, Any]
    ) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom Title Style
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            textColor=colors.HexColor('#1A237E') # Deep Navy
        )

        elements = []

        # Header
        elements.append(Paragraph("FinnEDu - Premium Loan Projection Report", title_style))
        elements.append(Paragraph(f"Prepared for: {user_name}", styles['Normal']))
        elements.append(Paragraph(f"Date: 2026-02-27", styles['Normal']))
        elements.append(Spacer(1, 20))

        # Loan Parameters Table
        data = [
            ["Parameter", "Value"],
            ["Institution", f"{loan_details.get('university_name', 'N/A')} ({loan_details.get('university_tier', 'General')})"],
            ["Original Principal", f"INR {loan_details['principal_amount']:,.2f}"],
            ["Interest Rate", f"{loan_details['interest_rate']}% (RLLR Based)"],
            ["Course Duration", f"{loan_details['course_duration_years']} Years"],
            ["Subvention Type", loan_details['subvention_type']]
        ]
        
        t = Table(data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8EAF6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ]))
        elements.append(Paragraph("1. Primary Loan Parameters", styles['Heading2']))
        elements.append(t)
        elements.append(Spacer(1, 20))

        # Financial Projections Table
        proj_data = [
            ["Metric", "Post-Moratorium (Projected)"],
            ["Moratorium Interest", f"INR {repayment_summary['moratorium_interest']:,.2f}"],
            ["Capitalized Principal", f"INR {repayment_summary['capitalized_principal']:,.2f}"],
            ["Projected Monthly EMI", f"INR {repayment_summary['emi']:,.2f}"],
            ["Sec 80E Tax Benefit (8Y)", f"INR {repayment_summary.get('tax_benefit_80E', 0):,.2f}"]
        ]
        
        t2 = Table(proj_data, colWidths=[200, 200])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F8E9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ]))
        elements.append(Paragraph("2. Financial Projections (2026 Compliance)", styles['Heading2']))
        elements.append(t2)
        
        # Compliance Disclaimer
        elements.append(Spacer(1, 30))
        disclaimer_style = ParagraphStyle('Disclaimer', fontSize=8, textColor=colors.grey)
        elements.append(Paragraph(
            "*Disclaimer: This projection is based on 2026 RBI guidelines and current benchmark EBLR rates. "
            "Actual rates may vary at the time of disbursement. This is not a binding commitment for credit.*",
            disclaimer_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer
