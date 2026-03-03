from datetime import datetime, timedelta
import uuid

class SmartCalendarService:
    def generate_ics(self, simulation_data, university_name, bank_branch=None):
        """
        Generates an ICS file content for EMI reminders and moratorium check-ins.
        """
        events = []
        
        # 1. Moratorium Phase
        moratorium_months = simulation_data.get('moratorium_months', 48 + 12)
        start_date = datetime.now()
        
        for i in range(1, moratorium_months + 1):
            check_in_date = start_date + timedelta(days=30 * i)
            event = self._create_vevent(
                summary="Study Period: Interest Accrual Check-in",
                description="Interest is accruing. Maintain acad tier to sustain ROI.",
                start_time=check_in_date,
                category="MORATORIUM"
            )
            events.append(event)
            
        # 2. Repayment Phase
        repayment_months = simulation_data.get('repayment_months', 180)
        emi_amount = simulation_data.get('emi', 0)
        sustainability = simulation_data.get('sustainability_data', {})
        stress_score = sustainability.get('health_score', 0)
        is_subvention = simulation_data.get('vidyalaxmi_eligible', False)
        
        for i in range(1, repayment_months + 1):
            payment_date = start_date + timedelta(days=30 * (moratorium_months + i))
            
            desc = f"EMI Due: ₹{emi_amount}. "
            if stress_score < 60:
                desc += "High Stress Month! Check Strategy: http://localhost:5173/gig-optimizer"
            if is_subvention:
                desc += " [Subsidy Active: 3% PM-Vidyalaxmi]"
                
            location = ""
            if i == 1 and bank_branch:
                location = f"{bank_branch.get('name', 'Bank Branch')}, {bank_branch.get('formatted_address', '')}"
                desc += f" First Payment/Doc Submission. Route: {bank_branch.get('maps_url', '#')}"

            event = self._create_vevent(
                summary=f"EMI Due: ₹{emi_amount}",
                description=desc,
                start_time=payment_date,
                location=location,
                category="REPAYMENT"
            )
            events.append(event)
            
        ics_content = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FinnEDu//FinnEDu 1.0//EN\n"
        ics_content += "".join(events)
        ics_content += "END:VCALENDAR"
        
        return ics_content

    def _create_vevent(self, summary, description, start_time, location="", category=""):
        dt_start = start_time.strftime("%Y%m%dT090000")
        dt_end = start_time.strftime("%Y%m%dT100000")
        dt_stamp = datetime.now().strftime("%Y%m%dT%H%M%SZ")
        uid = str(uuid.uuid4())
        
        event = [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dt_stamp}",
            f"DTSTART:{dt_start}",
            f"DTEND:{dt_end}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            f"CATEGORIES:{category}",
            "END:VEVENT",
            ""
        ]
        return "\n".join(event)
