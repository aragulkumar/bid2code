# BIT2CODE — Complete Website Build Prompt + Docker/Event Guide

## 1. Project Goal

Build a complete online coding competition platform called **BIT2CODE** for an IEEE Computer Society event.

Event date: **29 September 2026**

The platform must be simple, reliable, and easy to operate during a live online event.

### Final event format

- Individual participation: **1 participant per account**
- Maximum expected participants: **40**
- Every participant starts with **1000 virtual auction points**
- There is **ONE live algorithm auction**
- The auctioned algorithm is **Medium difficulty**
- Each algorithm auction lasts exactly **45 seconds**
- Participants can see the current algorithm being auctioned and place a bid
- A participant can bid only while they have not already won an algorithm
- Once a participant wins an algorithm, they are locked and cannot participate in later auctions
- The auction continues algorithm-by-algorithm for up to 40 auction cycles / slots
- At the end, participants who never won a bid receive an available algorithm **randomly**
- Do NOT build complicated attendance/presence systems
- Participants who already acquire an algorithm can immediately start their coding round; they do NOT need to wait for everyone else
- Each participant gets:
  1. One **Medium** problem related to their auctioned algorithm
  2. One **Easy** problem assigned randomly
- The participant has **40 minutes** from their individual coding start time
- The coding timer is therefore **per participant**, not one global timer
- Automatic code judging is required
- No jury/manual judging is required
- The website should also contain an event information/landing page and participant registration.

---

# 2. Important Simplification

Do NOT over-engineer attendance, teams, multiple rounds, or complicated scheduling.

There is no:
- team system
- attendance confirmation
- present/absent workflow
- second auction
- second coding round
- jury scoring
- manual score entry

The core flow is:

Registration → Login → Auction → Algorithm Assigned → Start Coding → 40-minute Personal Timer → Submit → Automatic Judge → Score/Leaderboard

---

# 3. Recommended Technology Stack

Use:

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Monaco Editor
- React Router

### Backend
- Python
- Django
- Django REST Framework

### Database
- PostgreSQL

For development, Docker Compose should run:
- PostgreSQL
- Django backend
- Judge0 CE
- Redis if needed for asynchronous jobs

### Code execution
Use **Judge0 CE** through Docker.

The browser must NEVER execute submitted code itself.

The architecture should be:

Participant Browser
        ↓
React Frontend
        ↓
Django REST API
        ↓
Judge Queue / Judge0 CE
        ↓
Sandboxed Execution
        ↓
Django stores result
        ↓
Frontend displays result

Do not expose Judge0 directly to participants.

---

# 4. Landing / Home Page

Create a polished event homepage.

## Hero section

BIT2CODE

### Strategic Algorithm Auction
**Bid Smart. Code Smarter.**

Online Technical Coding Challenge

**29 September 2026**

Show two CTA buttons:

- `Register Now`
- `Login`

Add a short description:

> BIT2CODE is an online coding challenge where participants compete in a live algorithm auction, secure an algorithm through strategic bidding, and solve coding problems based on their assigned algorithm.

---

# 5. Event Details Section

Display:

### Event Format

- Individual participation
- Maximum 40 participants
- Online
- Live Algorithm Auction
- 1000 virtual points per participant
- 45-second auction cycles
- Medium algorithm problem
- Random Easy problem
- 40-minute coding session
- Automatic evaluation

### How It Works

Use a 4-step visual flow:

1. **Register**
   Create your account and join BIT2CODE.

2. **Bid**
   Use your 1000 virtual points to bid for an algorithm.

3. **Code**
   Once your algorithm is assigned, your personal 40-minute coding timer begins.

4. **Submit**
   Submit your solutions and receive automatic evaluation.

---

# 6. Registration

Create a registration page.

Required fields:

- Full Name
- Email
- Phone Number
- College / Institution
- Department
- Year of Study
- Username
- Password
- Confirm Password

Optional:
- GitHub profile
- LinkedIn profile

Terms checkbox:

`I agree to participate in BIT2CODE and follow the event rules.`

After registration:
- create participant account
- give starting balance = 1000
- redirect to login
- show successful registration message

Prevent duplicate email and username.

---

# 7. Authentication

Implement:

- Register
- Login
- Logout
- JWT authentication
- Protected participant dashboard
- Admin login

Participant should only access their own:
- balance
- bids
- assigned algorithms
- problems
- submissions
- score
- timer

Never trust frontend values for:
- balance
- auction status
- auction timer
- assignment
- score
- submission deadline

All authoritative values must come from Django.

---

# 8. Participant Dashboard

Create a dashboard showing:

## Header

BIT2CODE

Participant name

Balance:
**1000 points**

Status:
`Waiting for Auction`

or:

`Algorithm Assigned: Dynamic Programming`

---

# 9. Auction Page

This is the most important feature.

All currently active participants see the same live auction.

Example:

```text
LIVE ALGORITHM AUCTION

Current Algorithm
🔥 DYNAMIC PROGRAMMING

Auction Time
00:31

Your Balance
1000

Your Current Bid
450

[ PLACE BID ]

Current Highest Bids
1.  P12 — 600
2.  P07 — 550
3.  P21 — 500
...
```

Do not reveal unnecessary personal information.

Prefer participant IDs or anonymous labels instead of full names.

---

# 10. Auction Rules

Implement exactly these rules.

### Starting balance

Every participant:

`1000 points`

### Auction duration

Every algorithm auction:

`45 seconds`

Timer must be controlled by server timestamps.

Do NOT rely on a browser countdown as the source of truth.

---

## Bid validation

A bid is valid only when:

- auction is active
- auction has not expired
- participant has not already won an algorithm
- participant has enough points
- bid is greater than the current valid bid
- participant is authenticated

Use a database transaction / row lock to prevent two simultaneous bids from corrupting the state.

---

# 11. Auction Model

Create models similar to:

### Participant

- id
- user
- name
- email
- balance
- algorithm_assigned
- coding_started_at
- coding_deadline
- created_at

### Algorithm

- id
- name
- description
- difficulty
- available_slots
- active

### Auction

- id
- algorithm
- start_time
- end_time
- status
- current_highest_bid
- winner_count

### Bid

- id
- auction
- participant
- amount
- created_at

### ParticipantAlgorithm

- participant
- algorithm
- assignment_type
  - `BID`
  - `RANDOM`
- winning_bid
- assigned_at

### Problem

- id
- title
- description
- difficulty
- algorithm
- constraints
- examples
- input_format
- output_format
- time_limit
- memory_limit
- hidden_test_cases

### Submission

- id
- participant
- problem
- language
- source_code
- submitted_at
- status
- score
- execution_time
- memory_used

---

# 12. How the Auction Ends

When the 45 seconds finish:

1. Stop accepting bids.
2. Determine the winning bid(s).
3. Assign the algorithm to the required participant(s).
4. Deduct only the winning bid.
5. Lock those participants from future auctions.
6. Mark losing bids as unsuccessful.
7. Move to the next algorithm.
8. Repeat.

Important:

**Do NOT deduct points from losing bids.**

---

# 13. Algorithm Slots

Because up to 40 participants may participate, the system must support multiple participants receiving the same algorithm.

Do NOT assume every algorithm is unique.

Example:

```text
Dynamic Programming      5 slots
Graph                    5 slots
Trees                    5 slots
Greedy                   5 slots
Binary Search            5 slots
Hashing                  5 slots
Two Pointers             5 slots
Stack & Queue             5 slots
--------------------------------
Total                   40 slots
```

The admin must be able to change slot counts.

The total available slots should normally equal the maximum expected participants.

---

# 14. Final Random Assignment

After all normal auction cycles:

Find all participants who still do not have an algorithm.

Find all remaining algorithm slots.

Randomly assign the remaining slots to those participants.

Example:

```text
Participants waiting:
P03
P11
P29

Remaining slots:
Graph
Greedy
Hashing
```

Randomly assign:

```text
P03 → Hashing
P11 → Graph
P29 → Greedy
```

Store:

`assignment_type = RANDOM`

Do NOT make participants wait indefinitely.

---

# 15. Starting the Coding Round

IMPORTANT:

The coding timer is **individual**.

As soon as a participant receives an algorithm:

Show:

```text
Algorithm Assigned:
Dynamic Programming

[ START CODING ]
```

When they click Start Coding:

Server records:

`coding_started_at = server_time`

and:

`coding_deadline = coding_started_at + 40 minutes`

The participant does not need to wait for anyone else.

---

# 16. Coding Page

Layout:

### Left side

Problem statement.

Show:

- title
- difficulty
- description
- constraints
- examples
- input format
- output format

### Right side

Monaco Editor.

Controls:

- language selector
- Run Code
- Submit

Supported languages initially:

- Python
- C++
- Java

Do not add many languages unless necessary.

---

# 17. Two Problems

Every participant receives:

### Problem 1
**Medium**
- algorithm should match the algorithm they won in the auction

### Problem 2
**Easy**
- randomly selected from the Easy problem bank

The participant can solve both during the same 40-minute window.

---

# 18. Problem Assignment Logic

Medium problem:

```text
participant.algorithm
        ↓
find problems with matching algorithm
        ↓
randomly select one suitable Medium problem
```

Easy problem:

```text
find all Easy problems
        ↓
randomly select one
```

Avoid assigning the same exact problem to every participant if possible.

The admin should be able to manage the problem bank.

---

# 19. Enforcing the Auction Algorithm

The Medium problem should genuinely require the assigned algorithm.

Do not merely tag an unrelated problem with an algorithm.

For example:

If assigned:

`Binary Search`

the problem should have constraints that make an efficient binary-search solution appropriate.

The intended algorithm should be represented in the problem metadata.

---

# 20. Automatic Judging

When the participant clicks Submit:

React sends:

```text
problem_id
language
source_code
```

to Django.

Django:

1. validates participant
2. validates coding deadline
3. stores submission
4. sends code to Judge0
5. receives execution result
6. calculates score
7. stores result
8. sends result to frontend

Possible statuses:

- Queued
- Running
- Accepted
- Wrong Answer
- Time Limit Exceeded
- Compilation Error
- Runtime Error
- Memory Limit Exceeded

---

# 21. Security

This is extremely important.

Never do:

```python
exec(user_code)
```

Never execute participant code directly inside Django.

Use Judge0 / isolated containers.

Also:

- hidden test cases must never be sent to frontend
- validate submission size
- enforce execution time
- enforce memory limits
- rate-limit submissions
- authenticate every API request
- prevent accessing another participant's submissions
- never trust client-side score
- never trust client-side balance
- never trust client-side timer
- prevent submissions after deadline
- log important actions

---

# 22. 40-Minute Timer

The timer must be based on server time.

Frontend can display:

```text
39:58
39:57
39:56
...
```

but Django remains authoritative.

If the browser is refreshed:

- retrieve `coding_deadline` from server
- calculate remaining time
- continue correctly

If the browser is closed:

- timer continues on the server

When deadline is reached:

- disable Submit
- disable Run Code
- automatically finalize the participant's current score

---

# 23. Leaderboard

Create a leaderboard page.

Columns:

```text
Rank
Participant
Medium Score
Easy Score
Total Score
Penalty / Time
```

Keep scoring simple and objective.

Recommended initial scoring:

### Each problem

100 points

Total:

200 points

Final score:

`Medium Score + Easy Score`

If two participants have the same score:

1. fewer total execution time
2. earlier final accepted submission

If you retain an auction-budget bonus, make it an explicit event rule and implement it consistently.

---

# 24. Admin Dashboard

Admin must control the entire event.

Dashboard:

```text
BIT2CODE ADMIN

Participants: 37
Assigned: 24
Waiting: 13

Current Auction:
GRAPH

Time Remaining:
00:27

[ START AUCTION ]
[ CLOSE AUCTION ]
[ NEXT ALGORITHM ]
[ RANDOM ASSIGN REMAINING ]

Coding Participants:
24

Submissions:
87

[ VIEW LEADERBOARD ]
```

Admin features:

### Participants
- view registrations
- disable participant
- view balance
- view assigned algorithm

### Algorithms
- add/edit/delete
- configure slots
- activate/deactivate

### Auctions
- start
- pause if technically necessary
- close
- move to next algorithm
- see bids
- see winners

### Problems
- add/edit/delete
- set difficulty
- set algorithm
- configure test cases

### Competition
- see active participants
- see timers
- see submissions
- see scores
- finalize leaderboard

---

# 25. Real-Time Updates

Auction must feel live.

Use:

- Django Channels / WebSockets

or, if you want a simpler implementation:

- polling every 1–2 seconds

For the first working version, polling is acceptable.

Do not let real-time complexity delay the event.

---

# 26. Database Design

Use PostgreSQL.

Important relationships:

```text
User
 ↓
Participant
 ↓
Bids
 ↓
ParticipantAlgorithm
 ↓
Problems
 ↓
Submissions
```

Use database constraints and transactions wherever money-like auction points are involved.

---

# 27. Docker Architecture

Create:

```text
bit2code/
│
├── frontend/
├── backend/
├── judge0/
├── docker-compose.yml
├── .env.example
├── README.md
└── docs/
```

Docker services:

```text
frontend
backend
postgres
redis
judge0-server
judge0-workers
```

Do not make the frontend depend on Judge0 directly.

---

# 28. Docker Development Setup

Create a complete `docker-compose.yml`.

The developer should be able to run:

```bash
docker compose up --build
```

and start the development environment.

Create:

```text
.env.example
```

with placeholders for:

```text
DJANGO_SECRET_KEY=
DEBUG=
DATABASE_URL=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
JUDGE0_URL=
REDIS_URL=
```

Never commit real secrets.

---

# 29. Docker Guide Required in README

The README must explain:

## Install

Install:

- Docker Desktop
- Git
- Node.js only if frontend development outside Docker is needed
- Python only if backend development outside Docker is needed

## Clone

```bash
git clone <repository-url>
cd bit2code
```

## Environment

```bash
cp .env.example .env
```

Fill required values.

## Start

```bash
docker compose up --build
```

## Run migrations

```bash
docker compose exec backend python manage.py migrate
```

## Create admin

```bash
docker compose exec backend python manage.py createsuperuser
```

## Create test data

Provide a management command such as:

```bash
docker compose exec backend python manage.py seed_demo_data
```

This should create:
- algorithms
- slots
- sample problems
- sample users

## Stop

```bash
docker compose down
```

## Full reset

```bash
docker compose down -v
```

Clearly warn that `-v` deletes local database volumes.

---

# 30. Judge0 Laptop Setup

The event is online, so the organizer may run Judge0 on a laptop.

Requirements:

- laptop plugged into power
- prevent sleep
- stable internet
- Docker Desktop running
- Judge0 running continuously
- Django backend must be able to reach Judge0
- preferably use Ethernet if available

Do NOT expose Judge0 directly to the public internet.

Recommended architecture:

```text
Participants
     ↓
Cloudflare / Public Website
     ↓
Django Backend
     ↓
Secure tunnel / private connection
     ↓
Organizer Laptop
     ↓
Judge0 Docker
```

The backend should be the only component communicating with Judge0.

---

# 31. Test Before Event Day

Create a stress-test script.

Simulate:

- 40 participants
- simultaneous bids
- 40 submissions
- multiple languages
- wrong answers
- compilation errors
- timeouts
- browser refreshes
- participants reconnecting
- submissions near the deadline

Test:

```text
40 users
20+ simultaneous submissions
```

before the actual event.

Do not wait until 29 September.

---

# 32. Event Day Runbook

### Before event

At least 2–3 hours before:

```text
1. Start Docker
2. Start Django
3. Start Judge0
4. Verify PostgreSQL
5. Verify Redis if used
6. Verify frontend
7. Login as admin
8. Create/check event
9. Check algorithms
10. Check problem bank
11. Submit a test solution
12. Check leaderboard
13. Test one auction
14. Restart browser and verify state
15. Keep laptop connected to power
```

### Before participants enter

Test:

- Registration
- Login
- Auction
- Bid
- Algorithm assignment
- Random assignment
- Start coding
- 40-minute timer
- Submit
- Judge
- Leaderboard

---

# 33. Event Flow on 29 September 2026

Suggested flow:

```text
Participants visit website
        ↓
Read event details
        ↓
Register
        ↓
Login
        ↓
Enter auction
        ↓
45-second algorithm auction
        ↓
Winner receives algorithm
        ↓
Participant starts immediately
        ↓
40-minute personal coding timer
        ↓
Solve:
  Medium algorithm problem
  +
  Random Easy problem
        ↓
Submit
        ↓
Automatic evaluation
        ↓
Leaderboard
```

---

# 34. Important UX Rule

The platform must always clearly show:

```text
Your Algorithm:
Dynamic Programming

Your Coding Deadline:
10:42 PM

Time Remaining:
32:14

Medium Problem:
...

Easy Problem:
...
```

Never make participants guess whether they are allowed to start.

---

# 35. Failure Handling

Implement safe recovery.

If Judge0 is temporarily unavailable:

Show:

> `Submission received. Your code is queued for evaluation.`

Store the submission first.

Do not lose the code.

If the participant refreshes:

- restore algorithm
- restore problems
- restore timer
- restore submissions
- restore score

If Django restarts:

- auction state must be recoverable from PostgreSQL
- coding deadlines must remain valid

Never store critical event state only in React memory.

---

# 36. Deliverables

Generate the entire project with:

### Frontend
- landing page
- registration
- login
- dashboard
- auction page
- coding page
- leaderboard
- responsive design

### Backend
- authentication
- participant management
- algorithms
- auctions
- bids
- assignments
- problems
- submissions
- judging
- leaderboard
- admin APIs

### Infrastructure
- Docker Compose
- PostgreSQL
- Redis if needed
- Judge0
- environment configuration

### Documentation
Create:

```text
README.md
DOCKER_GUIDE.md
EVENT_DAY_GUIDE.md
API.md
AUCTION_RULES.md
```

---

# 37. Design Requirements

Use a modern technical-event design.

Style:

- dark/light professional UI
- strong typography
- clean cards
- countdown timer
- clear auction status
- responsive on laptop and mobile
- avoid unnecessary animations
- avoid huge images
- prioritize speed and readability

Brand:

**BIT2CODE**

Tagline:

**Bid Smart. Code Smarter.**

---

# 38. Critical Implementation Rule

Do NOT build a generic LeetCode clone.

Build only the features required for BIT2CODE.

The product is an event platform whose key differentiator is:

**Algorithm Auction → Personalized Problem → Individual 40-Minute Coding Challenge**

Prioritize reliability over feature count.

---

# 39. Development Order

Implement in this exact order:

### Phase 1
Project structure + Docker + PostgreSQL

### Phase 2
Django authentication + participant registration

### Phase 3
Landing page

### Phase 4
Algorithm/problem models + admin

### Phase 5
Auction engine

### Phase 6
Real-time/polling auction UI

### Phase 7
Problem assignment

### Phase 8
Monaco coding interface

### Phase 9
Judge0 integration

### Phase 10
40-minute individual timer

### Phase 11
Leaderboard

### Phase 12
Security + validation

### Phase 13
Stress testing

### Phase 14
Deployment/event setup

Do not jump to deployment before the local event flow works completely.

---

# 40. Acceptance Test

The project is considered complete only if this scenario works:

```text
Create 40 participants
        ↓
Give each 1000 points
        ↓
Start auction
        ↓
Auction lasts 45 seconds
        ↓
Participants place bids
        ↓
Winning participants get algorithm
        ↓
Winning bids are deducted
        ↓
Winners are locked
        ↓
Next auction begins
        ↓
Continue until all normal auction cycles finish
        ↓
Remaining participants receive random algorithms
        ↓
Participant clicks Start Coding
        ↓
40-minute personal timer begins
        ↓
Participant receives:
  Medium problem matching algorithm
  Easy randomly assigned problem
        ↓
Participant submits code
        ↓
Judge0 evaluates
        ↓
Score is stored
        ↓
Leaderboard updates
```

Also test:

- participant refresh
- participant reconnect
- duplicate bid
- bid after auction closes
- insufficient balance
- simultaneous bids
- duplicate submission
- submission after deadline
- Judge0 failure
- backend restart
- browser close/reopen

---

# 41. Final Instruction to the Coding AI

Build the application as a production-minded event platform, but keep the feature set intentionally small.

Do not ask unnecessary questions.

When a requirement is ambiguous, choose the simplest implementation that preserves the stated BIT2CODE workflow and document the assumption in `README.md`.

First create the complete project architecture.

Then implement the backend.

Then implement the frontend.

Then connect Judge0.

Then run the complete end-to-end test.

Fix errors before considering the project complete.

The final result must be runnable with Docker Compose and suitable for a 40-participant online coding event on **29 September 2026**.
