# FinnEDu: Senior FinTech Backend Engine (2026 Edition)

FinnEDu is a high-precision backend architecture designed for the 2026 Indian banking regulatory landscape. It specializes in education loan logic, interest subvention schemes, and aggressive repayment simulations.

## 🚀 Key Features

- **2026 Compliance Engine**: Implemented PM-Vidyalaxmi (3% subvention) and CSIS (Full subvention) logic.
- **AI-Driven Financial Advisor**: Smart ROI comparison tool (Repayment vs SIP Investment).
- **Precision RBI Moratorium Logic**: Uses Simple Interest for grace period.
- **Section 80E Tax Calculator**: Automatic 8-year interest deduction tracking.
- **"Clear-Fast" Strategy Engine**: High-speed simulation for aggressive repayment.
- **Audit & Transparency**: Deep-audit logging for every financial event.
- **Real-time Health Analytics**: Backend metrics for live hackathon dashboards.

## 🛠 Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **Containerization**: Docker & Docker Compose
- **Logic**: NumPy-Financial (Precision financial calculations)

## 📁 Project Structure

```text
FinnEDu/
├── app/
│   ├── main.py          # API Endpoints & Routes
│   ├── models.py        # SQLAlchemy DB Schemas
│   ├── schemas.py       # Pydantic Validation Models
│   ├── database.py      # Connection & Session Management
│   └── services/
│       └── calculator.py # Core Financial Logic Engine
├── artifacts/           # Design & Implementation Artifacts
├── docker-compose.yml   # PostgreSQL Infrastructure
├── requirements.txt      # Dependency Management
└── .env                 # Environment Configuration
```

## 🚦 Quick Start

### 1. Provision Infrastructure
Start the PostgreSQL container:
```bash
docker-compose up -d
```

### 2. Set Up Environment
Install Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Launch API
Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The Interactive API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📊 Endpoints

- `POST /simulate`: Detailed simulation with subvention and tax logic.
- `POST /clear-fast`: Aggressive repayment strategy engine.
- `GET /rates`: Real-time benchmark data for Feb 2026.

## 📄 License

This project is dual-licensed under the **MIT License** and the **Apache License 2.0**.

- See [LICENSE-MIT](LICENSE-MIT) for the MIT license text.
- See [LICENSE-APACHE](LICENSE-APACHE) for the Apache license text.

---
*Developed for the next generation of Indian student financing.*
