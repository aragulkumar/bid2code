# BIT2CODE — Coding Problem Bank
## Medium Algorithm Problems + Easy Random Problems

Event: BIT2CODE  
Date: 29 September 2026  
Format: Individual  
Coding time: 40 minutes  
Problems per participant: 1 Medium + 1 Easy

---

# PART A — MEDIUM PROBLEM BANK

The Medium problem is selected according to the participant's auctioned algorithm.

Recommended structure:
- 8 algorithm categories
- 5 Medium problems per category
- 40 Medium problems total
- Multiple participants can receive the same algorithm, but the system should preferably rotate/randomize problems within that algorithm.

Algorithms:
1. Sorting
2. Binary Search
3. Hashing
4. Two Pointers / Sliding Window
5. Greedy
6. Stack & Queue
7. Dynamic Programming
8. Graph

---

# 1. SORTING

## S01 — Minimum Difference Pair

### Difficulty
Medium

### Problem
Given an array of N integers, find the minimum absolute difference between any two different elements.

### Input
First line: N  
Second line: N integers

### Output
Print the minimum absolute difference.

### Constraints
- 2 ≤ N ≤ 2 × 10^5
- -10^9 ≤ A[i] ≤ 10^9

### Example
Input:
```text
5
10 3 8 20 15
```

Output:
```text
2
```

### Intended Algorithm
Sort the array and compare adjacent elements.

### Complexity
O(N log N)

---

## S02 — Sort by Frequency

### Problem
Given an array, sort its elements by decreasing frequency. If two numbers have the same frequency, the smaller number must appear first.

### Example
Input:
```text
8
4 4 1 2 2 2 3 1
```

Output:
```text
2 2 2 1 1 3 4 4
```

### Constraints
- 1 ≤ N ≤ 2 × 10^5

### Intended Algorithm
Frequency counting + sorting using a custom comparator.

### Complexity
O(N log N)

---

## S03 — Merge Overlapping Intervals

### Problem
Given N intervals [start, end], merge all overlapping intervals and print the resulting intervals.

### Example
Input:
```text
4
1 3
2 6
8 10
9 12
```

Output:
```text
1 6
8 12
```

### Intended Algorithm
Sort intervals by starting point and merge sequentially.

### Complexity
O(N log N)

---

## S04 — Largest Possible Number

### Problem
Given N non-negative integers, arrange them so that they form the largest possible number when concatenated.

### Example
Input:
```text
5
3 30 34 5 9
```

Output:
```text
9534330
```

### Intended Algorithm
Sort using comparator:
`a+b > b+a`

### Complexity
O(N log N)

---

## S05 — Sort by Distance

### Problem
Given an integer X and an array, sort the elements by their absolute distance from X. If two elements have the same distance, place the smaller element first.

### Example
Input:
```text
6 10
12 5 8 15 10 7
```

Output:
```text
10 8 12 7 5 15
```

### Intended Algorithm
Sorting with a custom comparator.

### Complexity
O(N log N)

---

# 2. BINARY SEARCH

## B01 — First Position of Target

### Problem
Given a sorted array and a target value, find the first position where the target occurs. Print -1 if it does not exist.

### Example
Input:
```text
7
1 2 2 2 5 7 9
2
```

Output:
```text
1
```

Use zero-based indexing.

### Constraints
- N ≤ 2 × 10^5

### Intended Algorithm
Binary search for the first occurrence.

### Complexity
O(log N)

---

## B02 — Minimum Eating Speed

### Problem
There are N piles of items. A machine processes K items per hour. Find the minimum K such that all items can be processed within H hours.

### Example
Input:
```text
4 8
3 6 7 11
```

Output:
```text
4
```

### Intended Algorithm
Binary search on the answer.

### Complexity
O(N log(max(A)))

---

## B03 — Allocate Books

### Problem
Given N books with different page counts and K students, allocate consecutive books to students so that the maximum pages assigned to any student is minimized.

Each book must be assigned to exactly one student.

### Example
Input:
```text
4 2
10 20 30 40
```

Output:
```text
60
```

### Intended Algorithm
Binary search on maximum allowed pages + greedy feasibility check.

### Complexity
O(N log(sum(A)))

---

## B04 — Search in Rotated Sorted Array

### Problem
A sorted array has been rotated at an unknown position. Find the index of a target value.

### Example
Input:
```text
7
4 5 6 7 0 1 2
0
```

Output:
```text
4
```

### Intended Algorithm
Modified binary search.

### Complexity
O(log N)

---

## B05 — Aggressive Placement

### Problem
Given N positions and K objects, place the objects so that the minimum distance between any two objects is as large as possible.

### Example
Input:
```text
5 3
1 2 4 8 9
```

Output:
```text
3
```

### Intended Algorithm
Sort positions + binary search on answer + greedy feasibility.

### Complexity
O(N log range)

---

# 3. HASHING

## H01 — Longest Consecutive Sequence

### Problem
Given an unsorted array, find the length of the longest sequence of consecutive integers.

### Example
Input:
```text
6
100 4 200 1 3 2
```

Output:
```text
4
```

The sequence is 1,2,3,4.

### Intended Algorithm
Hash set.

### Complexity
O(N) average

---

## H02 — Subarray Sum Equals K

### Problem
Given an integer array and K, count the number of continuous subarrays whose sum equals K.

### Example
Input:
```text
5 3
1 2 1 1 1
```

Output:
```text
3
```

### Intended Algorithm
Prefix sum + frequency hash map.

### Complexity
O(N)

---

## H03 — Longest Subarray With Sum Zero

### Problem
Find the length of the longest continuous subarray whose sum is zero.

### Example
Input:
```text
6
15 -2 2 -8 1 7
```

Output:
```text
5
```

### Intended Algorithm
Prefix sum + first occurrence hash map.

### Complexity
O(N)

---

## H04 — First Unique Character

### Problem
Given a lowercase string, find the index of the first character that occurs exactly once.

### Example
Input:
```text
swiss
```

Output:
```text
1
```

### Intended Algorithm
Frequency map + second pass.

### Complexity
O(N)

---

## H05 — Equal Frequency Subarrays

### Problem
Given an array containing positive integers, find the maximum length of a subarray containing equal numbers of even and odd elements.

### Example
Input:
```text
6
2 5 4 7 8 9
```

Output:
```text
6
```

### Intended Algorithm
Convert even to +1 and odd to -1, then use prefix-sum hashing.

### Complexity
O(N)

---

# 4. TWO POINTERS / SLIDING WINDOW

## T01 — Longest Subarray With At Most K Distinct Values

### Problem
Given an array and K, find the length of the longest contiguous subarray containing at most K distinct values.

### Example
Input:
```text
7 2
1 2 1 2 3 2 2
```

Output:
```text
4
```

### Intended Algorithm
Sliding window + frequency map.

### Complexity
O(N)

---

## T02 — Longest Substring Without Repeating Characters

### Problem
Given a string, find the length of the longest substring without repeated characters.

### Example
Input:
```text
abcabcbb
```

Output:
```text
3
```

### Intended Algorithm
Sliding window + last occurrence map/set.

### Complexity
O(N)

---

## T03 — Maximum Consecutive Ones With K Changes

### Problem
Given a binary array, you may change at most K zeroes into ones. Find the maximum number of consecutive ones possible.

### Example
Input:
```text
7 2
1 1 0 0 1 1 1
```

Output:
```text
5
```

### Intended Algorithm
Sliding window.

### Complexity
O(N)

---

## T04 — Container With Most Water

### Problem
Given heights of vertical lines, choose two lines that hold the maximum amount of water.

### Example
Input:
```text
9
1 8 6 2 5 4 8 3 7
```

Output:
```text
49
```

### Intended Algorithm
Two pointers.

### Complexity
O(N)

---

## T05 — Count Subarrays With Sum At Most K

### Problem
Given an array of non-negative integers and K, count the number of contiguous subarrays whose sum is at most K.

### Example
Input:
```text
4 5
1 2 1 3
```

Output:
```text
8
```

### Intended Algorithm
Sliding window.

### Complexity
O(N)

---

# 5. GREEDY

## G01 — Activity Selection

### Problem
Given N activities with start and finish times, select the maximum number of non-overlapping activities.

### Example
Input:
```text
6
1 2
3 4
0 6
5 7
8 9
5 9
```

Output:
```text
4
```

### Intended Algorithm
Sort by finishing time and greedily select.

### Complexity
O(N log N)

---

## G02 — Minimum Number of Platforms

### Problem
Given arrival and departure times of trains, find the minimum number of platforms required so that no train waits.

### Example
Input:
```text
6
900 940 950 1100 1500 1800
910 1200 1120 1130 1900 2000
```

Output:
```text
3
```

### Intended Algorithm
Sort arrivals/departures and use two pointers.

### Complexity
O(N log N)

---

## G03 — Fractional Knapsack

### Problem
Given items with value and weight and a bag capacity W, maximize total value. Items may be taken fractionally.

### Intended Algorithm
Sort by value/weight ratio and greedily take the best ratio first.

### Complexity
O(N log N)

---

## G04 — Minimum Coins

### Problem
Given coin denominations and an amount, find the minimum number of coins required. Assume the given denomination system supports the greedy solution.

### Example
Input:
```text
3
1 5 10
28
```

Output:
```text
6
```

### Intended Algorithm
Take the largest possible denomination first.

### Complexity
O(N log N + amount/coin)

---

## G05 — Job Sequencing With Deadlines

### Problem
Each job has a deadline and profit. Every job takes one unit of time. Schedule jobs to maximize total profit.

### Intended Algorithm
Sort jobs by profit descending and place each job in the latest available slot before its deadline.

### Complexity
O(N log N + N × D)

---

# 6. STACK & QUEUE

## SQ01 — Next Greater Element

### Problem
For every element in an array, find the first greater element to its right. If none exists, print -1.

### Example
Input:
```text
4
4 5 2 10
```

Output:
```text
5 10 10 -1
```

### Intended Algorithm
Monotonic stack.

### Complexity
O(N)

---

## SQ02 — Valid Parentheses

### Problem
Given a string containing (), {}, and [], determine whether the brackets are correctly balanced.

### Example
Input:
```text
{[()]}
```

Output:
```text
YES
```

### Intended Algorithm
Stack.

### Complexity
O(N)

---

## SQ03 — Daily Temperatures

### Problem
For each day, determine how many days must pass before a warmer temperature occurs.

### Example
Input:
```text
8
73 74 75 71 69 72 76 73
```

Output:
```text
1 1 4 2 1 1 0 0
```

### Intended Algorithm
Monotonic stack.

### Complexity
O(N)

---

## SQ04 — Largest Rectangle in Histogram

### Problem
Given heights of histogram bars, find the largest rectangular area.

### Example
Input:
```text
6
2 1 5 6 2 3
```

Output:
```text
10
```

### Intended Algorithm
Monotonic stack.

### Complexity
O(N)

---

## SQ05 — Sliding Window Maximum

### Problem
Given an array and window size K, print the maximum value in every window.

### Example
Input:
```text
8 3
1 3 -1 -3 5 3 6 7
```

Output:
```text
3 3 5 5 6 7
```

### Intended Algorithm
Deque / monotonic queue.

### Complexity
O(N)

---

# 7. DYNAMIC PROGRAMMING

## DP01 — Climbing Stairs With Variable Steps

### Problem
You can climb either 1, 2, or 3 stairs at a time. Find the number of different ways to reach stair N.

### Example
Input:
```text
5
```

Output:
```text
13
```

### Intended Algorithm
One-dimensional DP.

### Complexity
O(N)

---

## DP02 — House Robber

### Problem
Given money in houses arranged in a line, find the maximum amount that can be stolen without robbing two adjacent houses.

### Example
Input:
```text
5
2 7 9 3 1
```

Output:
```text
12
```

### Intended Algorithm
1D DP.

### Complexity
O(N)

---

## DP03 — Coin Change

### Problem
Given coin denominations and an amount, find the minimum number of coins needed to make the amount. Return -1 if impossible.

### Example
Input:
```text
3 11
1 2 5
```

Output:
```text
3
```

### Intended Algorithm
Bottom-up DP.

### Complexity
O(N × amount)

---

## DP04 — Longest Increasing Subsequence

### Problem
Find the length of the longest strictly increasing subsequence.

### Example
Input:
```text
8
10 9 2 5 3 7 101 18
```

Output:
```text
4
```

### Intended Algorithm
DP or optimized binary-search LIS.

### Complexity
O(N²) DP is acceptable for smaller constraints; O(N log N) preferred for larger constraints.

---

## DP05 — 0/1 Knapsack

### Problem
Given N items with weights and values and a capacity W, find the maximum value that can be obtained. Each item can be selected at most once.

### Intended Algorithm
0/1 dynamic programming.

### Complexity
O(NW)

---

# 8. GRAPH

## GR01 — Number of Islands

### Problem
Given a grid containing 0 and 1, count the number of connected groups of 1s. Cells are connected vertically and horizontally.

### Example
Input:
```text
4 5
1 1 0 0 0
1 1 0 1 0
0 0 1 0 0
0 0 0 1 1
```

Output:
```text
4
```

### Intended Algorithm
DFS or BFS.

### Complexity
O(R × C)

---

## GR02 — Shortest Path in an Unweighted Graph

### Problem
Given an unweighted graph and two vertices S and T, find the shortest number of edges between them. Print -1 if unreachable.

### Intended Algorithm
BFS.

### Complexity
O(V + E)

---

## GR03 — Detect Cycle in an Undirected Graph

### Problem
Given an undirected graph, determine whether it contains a cycle.

### Intended Algorithm
DFS with parent tracking or Disjoint Set Union.

### Complexity
O(V + E)

---

## GR04 — Course Schedule

### Problem
There are N courses and prerequisite relationships. Determine whether all courses can be completed.

### Intended Algorithm
Topological sorting / Kahn's algorithm.

### Complexity
O(V + E)

---

## GR05 — Minimum Spanning Tree Cost

### Problem
Given a connected weighted undirected graph, find the total minimum cost needed to connect all vertices.

### Intended Algorithm
Kruskal's algorithm + DSU or Prim's algorithm.

### Complexity
O(E log E)

---

# PART B — EASY RANDOM PROBLEM BANK

These problems are independent of the auctioned algorithm.

Recommended: create at least 20 Easy problems and randomly assign one to each participant.

---

## E01 — Sum of Array

Given N integers, print their sum.

---

## E02 — Maximum Element

Given an array, print the largest element.

---

## E03 — Count Even Numbers

Given an array, count how many values are even.

---

## E04 — Reverse a String

Given a string, print it in reverse order.

---

## E05 — Palindrome String

Check whether a string reads the same forward and backward.

---

## E06 — Count Vowels

Given a string, count the vowels.

---

## E07 — Second Largest Element

Find the second largest distinct value in an array.

---

## E08 — Remove Duplicates

Given an array, print its distinct elements in the order they first appear.

---

## E09 — Factorial

Given N, calculate N!.

Use an appropriate integer type based on the constraints.

---

## E10 — Fibonacci Number

Given N, print the Nth Fibonacci number.

---

## E11 — Prime Check

Determine whether a given integer is prime.

---

## E12 — Count Digits

Given an integer, count the number of digits.

---

## E13 — Armstrong Number

Check whether a number is an Armstrong number.

---

## E14 — GCD of Two Numbers

Find the greatest common divisor of two positive integers.

---

## E15 — LCM of Two Numbers

Find the least common multiple of two positive integers.

---

## E16 — Character Frequency

Given a lowercase string, print the frequency of each character that appears.

---

## E17 — Move Zeroes

Move all zeroes to the end while maintaining the relative order of non-zero elements.

Example:
```text
Input:
0 1 0 3 12

Output:
1 3 12 0 0
```

---

## E18 — Linear Search

Given an array and target X, print the first index of X or -1.

---

## E19 — Sum of Digits

Given an integer, calculate the sum of its digits.

---

## E20 — FizzBuzz

For numbers 1 through N:

- divisible by 3 → Fizz
- divisible by 5 → Buzz
- divisible by both → FizzBuzz
- otherwise print the number

---

# PART C — RECOMMENDED EVENT PROBLEM ASSIGNMENT

## Medium assignment

Use the participant's auctioned algorithm.

Example:

```text
Participant P01
Auctioned Algorithm: Graph

        ↓

Randomly select one unused Graph Medium problem

        ↓

P01 receives:
GR01 / GR02 / GR03 / GR04 / GR05
```

The system should randomize the problem selection.

Do not always give the first problem.

---

# Easy assignment

Easy problems can be selected randomly from the full Easy pool.

Example:

```text
P01 → E07
P02 → E14
P03 → E02
P04 → E18
```

If you want to reduce repeated questions, keep track of assignments and distribute the pool before reusing a problem.

---

# PART D — IMPORTANT DIFFICULTY GUIDELINE

The Medium problems should be solvable within the participant's 40-minute window, but should require the intended algorithm.

Avoid problems that require:
- advanced mathematics
- very large implementation
- complicated graph theory
- segment trees
- advanced data structures
- obscure tricks
- lengthy parsing
- external libraries

The goal is:

**Algorithm recognition + implementation + debugging**

not:

**long competitive-programming implementation.**

---

# PART E — PROBLEM METADATA FOR THE WEBSITE

Each problem in the database should contain:

```text
title
slug
description
difficulty
algorithm
constraints
input_format
output_format
sample_input
sample_output
time_limit
memory_limit
test_cases
hidden_test_cases
explanation
expected_algorithm
```

For Medium problems:

```text
difficulty = MEDIUM
algorithm = auctioned algorithm
```

For Easy problems:

```text
difficulty = EASY
algorithm = GENERAL
```

---

# PART F — IMPORTANT JUDGE DESIGN

For each problem create:

### Public tests
Visible to the participant.

### Hidden tests
Never sent to the frontend.

A submission should be judged against all hidden tests.

Example:

```text
10 hidden test cases

Passed: 10/10
Score: 100
```

Partial scoring can be used:

```text
Passed 8/10
Score 80
```

But ensure that critical edge cases are included.

---

# PART G — RECOMMENDED TEST CASE CATEGORIES

Every Medium problem should include:

1. Minimum input
2. Normal case
3. Large input
4. Duplicate values
5. Boundary values
6. Already sorted/reversed input where applicable
7. Worst-case pattern
8. Edge case
9. Random case
10. Maximum constraint case

This is especially important because the intended algorithm should be distinguishable from brute-force solutions through the constraints and time limit.
