# BIT2CODE — Docker & Infrastructure Guide

This guide details how to run, configure, and operate the entire BIT2CODE platform using Docker Compose.

---

## 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Version 24.0+ recommended)
- Git

---

## 2. Docker Architecture Overview

```text
bit2code/
├── frontend/               (React + Vite + TypeScript + Tailwind + Monaco)
│   └── Dockerfile          (Multi-stage build with Nginx)
├── backend/                (Django 5 + Django REST Framework + SimpleJWT)
│   └── Dockerfile          (Python 3.12-slim with psycopg2 and compilers)
├── docker-compose.yml      (Orchestrator for all microservices)
└── .env.example            (Environment configuration template)
```

### Docker Services in `docker-compose.yml`:
1. `backend`: Django REST API server on port `8000`.
2. `frontend`: React SPA served via Nginx on port `80` (or Vite dev on `5173`).
3. `postgres`: PostgreSQL 16 database on port `5432`.
4. `redis`: Redis 7 cache and queue service on port `6379`.
5. `judge0-server`: Sandboxed code execution server on port `2358`.
6. `judge0-workers`: Privileged sandbox execution workers.
7. `judge0-db` & `judge0-redis`: Isolated state stores for Judge0 CE.

---

## 3. Quick Start (Development & Production)

### Step 1: Clone Repository & Create Environment File
```bash
git clone https://github.com/aragulkumar/bid2code.git
cd bid2code
cp .env.example .env
```

### Step 2: Build and Launch All Containers
```bash
docker compose up --build -d
```

### Step 3: Run Migrations and Seed Demo Data
```bash
# Apply database migrations
docker compose exec backend python manage.py migrate

# Seed 40 participants, 8 algorithms, and 12 curated problem test suites
docker compose exec backend python manage.py seed_demo_data
```

### Step 4: Access Applications
- **Frontend User Interface**: [http://localhost:5173](http://localhost:5173) or [http://localhost:80](http://localhost:80)
- **Django REST API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin Portal**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
  - Username: `admin`
  - Password: `admin123`
- **Judge0 CE API**: [http://localhost:2358/about](http://localhost:2358/about)

---

## 4. Stopping & Resetting Containers

### Graceful Stop
```bash
docker compose down
```

### Full Clean Reset (Wipes Volumes & Database)
> [!CAUTION]
> Running with `-v` completely removes PostgreSQL database volumes and resets all data.
```bash
docker compose down -v
```

---

## 5. Running Stress Simulation in Docker
To simulate 40 concurrent participants bidding, entering coding sessions, and submitting solutions:
```bash
docker compose exec backend python manage.py stress_test_simulation
```
