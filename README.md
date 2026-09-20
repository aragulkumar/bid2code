# BIT2CODE — Strategic Algorithm Auction & Coding Competition Platform

> **Bid Smart. Code Smarter.**  
> Official online competitive programming platform for the IEEE Computer Society coding event on **29 September 2026**.

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Backend-Django%205%20%2B%20DRF-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker%20Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Judge0 CE](https://img.shields.io/badge/Execution-Judge0%20CE-F38020?logo=docker&logoColor=white)](https://judge0.com/)

---

## 📌 Event Highlights & Architecture

- 👥 **Individual Participation**: 1 participant per account (up to 40 participants).
- 💰 **1,000 Virtual Auction Points**: Granted instantly to every registered competitor.
- 🔥 **Live Algorithm Auction**: 45-second bidding cycles across 8 algorithm topics (Dynamic Programming, Graph, Trees, Greedy, Binary Search, Hashing, Two Pointers, Stack & Queue).
- 🔒 **Strategic Lock**: Only winning bids are deducted; winners are locked from subsequent auctions. Unallocated participants receive available topics via random allocation.
- ⏱️ **Individual 40-Minute Coding Timer**: Starts immediately when the participant clicks *Start Coding* — no global waiting required.
- 🧩 **2 Tailored Problems**:
  1. **Problem 1 (Medium)**: Directly tests the algorithm won in the auction.
  2. **Problem 2 (Easy)**: Randomly assigned from the general problem bank.
- ⚡ **Automated Sandboxed Evaluation**: Evaluated via Judge0 CE with multi-language support (Python 3, C++, Java).
- 🏆 **Live Realtime Leaderboard**: Ranked by total score (200 pts max), execution time, and submission timestamps.

---

## 📁 Repository Structure

```text
bid2code/
├── backend/
│   ├── bit2code_core/          # Django project settings, WSGI/ASGI, URLs
│   ├── competitions/           # Models, Serializers, Views, Timers, Migrations
│   │   └── management/commands # seed_demo_data & stress_test_simulation
│   ├── judge_service/          # Judge0 CE client & isolated fallback sandbox
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container image
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, Timer, VerdictBadge
│   │   ├── context/            # AuthContext (JWT tokens & profile)
│   │   ├── pages/              # Landing, Register, Login, Dashboard, Auction, Arena, Leaderboard, AdminPortal
│   │   ├── services/           # REST API client
│   │   └── types/              # TypeScript data model interfaces
│   ├── package.json            # React, Vite, Monaco Editor, Lucide, Tailwind
│   └── Dockerfile              # Multi-stage Nginx build
├── docs/
│   ├── AUCTION_RULES.md        # Complete competition format and bidding rules
│   ├── API.md                  # REST API endpoint reference
│   ├── DOCKER_GUIDE.md         # Comprehensive Docker setup and operations
│   └── EVENT_DAY_GUIDE.md      # Organizer runbook for 29 September 2026
├── docker-compose.yml          # Full multi-container stack definition
├── .env.example                # Configuration environment variables template
└── README.md
```

---

## 🚀 Quick Start with Docker Compose

1. **Clone the repository**:
   ```bash
   git clone https://github.com/aragulkumar/bid2code.git
   cd bid2code
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start all services**:
   ```bash
   docker compose up --build -d
   ```

4. **Initialize database & demo data**:
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_demo_data
   ```

5. **Open in browser**:
   - Web Platform: [http://localhost:5173](http://localhost:5173) or [http://localhost:80](http://localhost:80)
   - Admin Portal: [http://localhost:5173/admin-portal](http://localhost:5173/admin-portal)
   - Credentials: `admin` / `admin123`

---

## 🧪 Testing & Stress Simulation

Run the automated test suite:
```bash
python backend/manage.py test competitions
```

Run the 40-participant end-to-end stress simulation:
```bash
python backend/manage.py stress_test_simulation
```

---

## 📖 Documentation Links

- 📜 [Competition & Auction Rules](file:///r:/Projects/bid2code/docs/AUCTION_RULES.md)
- 🔌 [REST API Documentation](file:///r:/Projects/bid2code/docs/API.md)
- 🐳 [Docker Infrastructure Guide](file:///r:/Projects/bid2code/docs/DOCKER_GUIDE.md)
- 📋 [Event Day Organizer Runbook](file:///r:/Projects/bid2code/docs/EVENT_DAY_GUIDE.md)

---

## 📄 License & Attribution

Developed for **IEEE Computer Society BIT2CODE Event (29 September 2026)**.
All rights reserved.
