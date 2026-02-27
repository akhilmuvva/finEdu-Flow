# What we're building: Project Requirements
> My roadmap for FinnEDu (2026 Edition) - **Akhil**

## 🔹 Project Identification
*   **ID**: `FINEDU-2026-v1.5-SPEC`
*   **Version**: `1.5.0` | **Release**: `1.5 (Audit-Ready)`
*   **The Team**: **Akhil (Lead)**, Jhansi, and the Team.
*   **License**: MIT

---

## 1. What the app needs to do (Features)
These are the core pieces of logic I'm implementing:

*   **Smart Loan Simulation**: Use the 2026 RLLR baseline (starts at 6.5%) to calculate monthly repayments. 
    *   *Note*: The engine supports **floating rate recalculation** if the benchmark moves.
*   **Automatic Subsidy Detection**: If the user's income is low enough, the app flags them for **CSIS** (100% interest cover) or **PM-Vidyalaxmi** (3% rate cut) using NIRF metrics.
*   **AI Document Check**: A scanner to check if certificates are authentic. 
    *   *Storage*: Docs are processed **in-memory** for speed, with a roadmap for **AWS S3 (Encrypted)** storage.
*   **The Rejection Plan**: If a doc fails, give the user a step-by-step plan to fix it.
*   **Nearby Bank Fulfillment**: Geolocation mapping to find the closest branch that handles 2026 subsidies.
*   **International Study Tools**: Calculate Forex and the 2% tax (TCS) on self-funded amounts over 10L.
*   **Scholarship Scraper**: Built using **BeautifulSoup4** to fetch the latest govt/uni grants.

---

## 2. The Tech Stack (Our Quality Bar)

### Frontend
*   **Framework**: **React 18** + **Vite**.
*   **Design**: **Tailwind CSS** for layouts; **Anime.js** for 60fps liquid graphs.
*   **Hosting**: Prepped for **Vercel**.

### Backend
*   **Core**: **FastAPI (Python)**. High-speed, async, and perfect for financial logic.
*   **Auth**: **JWT (JSON Web Tokens)** for local sessions, with a **Firebase/Google Auth** roadmap.
*   **Hosting**: Prepped for **Render**.

### Database
*   **Current**: **SQLite** via SQLAlchemy (Local persistence).
*   **Production**: Seamless switch to **PostgreSQL**.
*   **Persistence**: We store full amortization schedules and audit logs for subsidy triggers.

---

## 3. Security & Access
*   **RBAC**: Role-based access for **Students** (Simulation/Uploads) and **Admins** (Policy/Bank updates).
*   **Privacy**: Zero logging of raw PII (Aadhaar/PAN) to the database.

---

## 4. The "2026 Policy" Rule
Per the 2026 mandate: **any income certificate dated before April 1, 2025, is a no-go.** The system will flag these as "Partial" so the user knows they need an update.

---
*Stayed focused on precision and user experience.*
