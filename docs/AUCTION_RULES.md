# BIT2CODE — Official Auction & Competition Rules

## 1. Overview
BIT2CODE is a premier competitive programming event organized for the **IEEE Computer Society** on **29 September 2026**. The format combines strategic live algorithm bidding with an individual 40-minute timed coding sprint.

---

## 2. Participant Wallets & Points
- Every registered participant starts with **1,000 virtual auction points**.
- Points are strictly virtual and used exclusively during the live algorithm auction.
- Points cannot be transferred between participants.

---

## 3. Algorithm Auction Format
1. **Duration**: Each algorithm auction cycle lasts **45 seconds**.
2. **One Live Algorithm at a Time**: The auction presents one algorithm topic (e.g. Dynamic Programming, Graph, Trees, Greedy, Binary Search, Hashing, Two Pointers, Stack & Queue).
3. **Slot Availability**: Each algorithm topic has a fixed number of available slots (typically 5 slots per algorithm across 8 topics = 40 total slots).
4. **Valid Bids**:
   - The bid amount must be strictly greater than the current highest bid.
   - The participant must have sufficient point balance in their wallet.
   - The participant must not have already acquired an algorithm.
5. **Winner Determination & Points Deduction**:
   - When the 45-second timer expires, the participant with the highest valid bid wins the algorithm.
   - **Only the winning bid amount is deducted** from the winner's wallet.
   - Losing participants lose **zero** points.
   - The winner is permanently locked from participating in subsequent auctions.
6. **Random Allocation**:
   - After normal auction cycles finish, any participant who has not yet acquired an algorithm is assigned an available topic **randomly** (`assignment_type = RANDOM`) at 0 points cost.

---

## 4. Coding Round & Individual 40-Minute Timers
- **Immediate Start**: As soon as a participant receives an algorithm, they can begin coding immediately by clicking **Start Coding**. They do not need to wait for other participants.
- **Authoritative Server Clock**: The 40-minute window begins when `coding_started_at` is set on the server (`coding_deadline = coding_started_at + 40 minutes`).
- **Problem Set**:
  - **Problem 1 (Medium)**: Directly requires the algorithmic technique acquired in the auction (e.g. dynamic programming transitions, binary search on answers, monotonic stack).
  - **Problem 2 (Easy)**: Randomly assigned from the curated easy challenge bank.
- **Auto-Lock on Expiration**: When the 40 minutes expire, the submission buttons lock automatically.

---

## 5. Scoring & Leaderboard Tie-Breakers
- **Scoring**:
  - Medium Problem: Up to **100 points** (graded proportionally by hidden test cases passed).
  - Easy Problem: Up to **100 points**.
  - Total Score: **200 points maximum**.
- **Tie-Breaking Order**:
  1. **Higher Total Score**.
  2. **Lower Total Execution Time** across best accepted submissions.
  3. **Earlier Timestamp** of final accepted submission.
