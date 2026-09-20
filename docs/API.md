# BIT2CODE — REST API Reference

Base URL: `http://localhost:8000/api`

All authenticated endpoints require standard JWT Bearer tokens:
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication & Profile Endpoints

### `POST /auth/register/`
Registers a new participant and automatically credits 1,000 starting points.
- **Request Body**:
  ```json
  {
    "full_name": "Alex Rivera",
    "email": "alex@mit.edu",
    "phone": "+91 9876543210",
    "college": "MIT Campus, Anna University",
    "department": "Computer Science",
    "year_of_study": "Year 2",
    "username": "alex_coder",
    "password": "secret_password",
    "confirm_password": "secret_password",
    "github_profile": "https://github.com/alex",
    "linkedin_profile": "https://linkedin.com/in/alex",
    "agree_terms": true
  }
  ```
- **Response**: `201 Created` with participant details, JWT `access`, and `refresh` tokens.

### `POST /auth/login/`
Authenticates a user / admin and returns JWT tokens.
- **Request Body**: `{"username": "...", "password": "..."}`
- **Response**: `{"access": "...", "refresh": "..."}`

### `GET /auth/me/`
Returns the current authenticated participant's profile, points balance, assigned algorithm, and live timer countdown status.

---

## 2. Algorithm & Auction Endpoints

### `GET /algorithms/`
Lists all active algorithms, difficulty levels, and remaining/assigned slot counts.

### `GET /auction/active/`
Returns the currently running 45-second algorithm auction, remaining seconds, and top recent bids with anonymous participant labels (e.g. `P01`, `P12`).

### `POST /auction/bid/`
Places an atomic bid on the active auction.
- **Request Body**:
  ```json
  {
    "auction_id": 1,
    "amount": 250
  }
  ```
- **Validation**:
  - Participant must not already have an algorithm.
  - Bid must exceed `current_highest_bid`.
  - Participant balance must be `>= amount`.

---

## 3. Coding Session & Problem Endpoints

### `POST /coding/start/`
Starts the participant's individual 40-minute coding clock.
- Sets `coding_started_at = now` and `coding_deadline = now + 40 minutes`.
- Assigns 1 Medium problem matching their algorithm + 1 Random Easy problem.

### `GET /coding/problems/`
Retrieves the 2 problems assigned to the participant, including sample test cases, input/output formats, time limits, and memory constraints.

---

## 4. Code Execution & Submissions

### `POST /submissions/run-sample/`
Executes code against sample test cases (or custom input) without affecting official scores.
- **Request Body**:
  ```json
  {
    "problem_id": 3,
    "language": "python",
    "source_code": "print('hello')",
    "custom_input": "optional test string"
  }
  ```

### `POST /submissions/submit/`
Submits code for official sandboxed grading via Judge0 CE.
- **Request Body**:
  ```json
  {
    "problem_id": 3,
    "language": "python",
    "source_code": "..."
  }
  ```
- **Verdict Responses**: `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `COMPILATION_ERROR`, `RUNTIME_ERROR`.
- Updates participant score and live leaderboard standings.

### `GET /submissions/history/`
Returns all past submissions for the authenticated participant.

---

## 5. Live Leaderboard Endpoint

### `GET /leaderboard/`
Returns real-time ranks, anonymous participant labels, full names, college affiliations, Medium Problem Score, Easy Problem Score, Total Score (out of 200), and execution time tie-breakers.

---

## 6. Admin Control Endpoints (Staff Only)

- `GET /admin-controls/overview/`: Live dashboard statistics.
- `POST /admin-controls/auction/start/`: Trigger a 45-second auction cycle.
- `POST /admin-controls/auction/close/`: Close active auction and resolve winner.
- `POST /admin-controls/auction/random-assign/`: Allocate remaining slots randomly to unassigned participants.
- `GET /admin-controls/participants/`: Full participant directory.
- `GET /admin-controls/submissions/`: Full submissions audit log.
