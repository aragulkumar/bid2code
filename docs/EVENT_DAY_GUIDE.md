# BIT2CODE — Event Day Organizer Runbook

Event Date: **29 September 2026**  
Organized for: **IEEE Computer Society**

---

## 1. Setup Timeline (T-3 Hours to Kickoff)

### [T-3 Hours] Infrastructure Check
1. **Power & Hardware**:
   - Ensure the server / organizer laptop is plugged directly into AC power with sleep settings disabled.
   - Connect via high-speed wired Ethernet connection.
2. **Launch Docker Services**:
   ```bash
   docker compose up --build -d
   ```
3. **Verify Service Health**:
   - PostgreSQL: `docker compose exec postgres pg_isready`
   - Judge0: Check `http://localhost:2358/about`
   - Backend API: Check `http://localhost:8000/api/`
   - Frontend: Open `http://localhost:5173`

### [T-2 Hours] Database Verification & Dry-Run
1. **Seed or Verify Problems**:
   ```bash
   docker compose exec backend python manage.py seed_demo_data
   ```
2. **Execute Automated Stress Test**:
   ```bash
   docker compose exec backend python manage.py stress_test_simulation
   ```
3. **Inspect Leaderboard**:
   - Confirm score tallies and tie-breakers display correctly at `/leaderboard`.

### [T-30 Minutes] Final Clean Reset for Real Event
1. Reset test data for real participants:
   ```bash
   docker compose exec backend python manage.py flush --no-input
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py seed_demo_data
   ```
2. Open Admin Portal: [http://localhost:5173/admin-portal](http://localhost:5173/admin-portal).

---

## 2. Live Event Execution Workflow

```text
[Step 1] Registration Opens (Participants join & receive 1,000 points)
    ↓
[Step 2] Live Algorithm Auction (Admin starts 45s cycles for each topic)
    ↓
[Step 3] Winner Resolution (Points deducted, winners proceed to coding)
    ↓
[Step 4] Random Allocation (Triggered for remaining unallocated participants)
    ↓
[Step 5] 40-Minute Coding Sprint (Each coder has individual countdown)
    ↓
[Step 6] Automated Evaluation (Judge0 evaluates test cases on submission)
    ↓
[Step 7] Final Standings & Winner Announcement (/leaderboard)
```

---

## 3. Emergency Contingency Plan

### Scenario 1: Judge0 Sandbox Experiencing Heavy Latency
- The backend automatically buffers submissions in PostgreSQL with `status='QUEUED'` so **no participant code is ever lost**.
- The resilient fallback sandbox will automatically evaluate test cases without blocking participant workflows.

### Scenario 2: Participant Refreshes or Reconnects
- All event state (balance, algorithm assignment, 40-minute timer deadline, and submission history) is stored authoritatively in PostgreSQL.
- On page refresh, the React frontend seamlessly retrieves and restores all session states.
