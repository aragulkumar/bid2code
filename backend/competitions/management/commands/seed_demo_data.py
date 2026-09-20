from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.text import slugify
from competitions.models import Algorithm, Participant, Problem

class Command(BaseCommand):
    help = 'Seeds all 8 algorithms, 40 Medium problems (5 per category), 20 Easy problems, admin, and demo participants from BIT2CODE problem bank.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("=== SEEDING FULL BIT2CODE PROBLEM BANK (40 MEDIUM + 20 EASY) ==="))

        # 1. Create Superuser / Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@bit2code.ieee.org',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Admin account ready: admin / admin123"))

        # 2. Create 8 Algorithm Categories (5 slots each = 40 total participant slots)
        algorithms_data = [
            {"name": "Sorting", "description": "Custom comparators, interval merges, frequency sorting, and adjacent difference checks.", "slots": 5, "order": 1},
            {"name": "Binary Search", "description": "Logarithmic search on monotonic answer spaces, first/last occurrences, and rotated arrays.", "slots": 5, "order": 2},
            {"name": "Hashing", "description": "Prefix sum hash maps, O(1) frequency lookups, and longest zero-sum / equal frequency subarrays.", "slots": 5, "order": 3},
            {"name": "Two Pointers", "description": "Sliding windows, left/right meeting pointers, at most K distinct values, and container water optimization.", "slots": 5, "order": 4},
            {"name": "Greedy", "description": "Activity selection, train platform scheduling, fractional knapsack, and minimum coins.", "slots": 5, "order": 5},
            {"name": "Stack & Queue", "description": "Monotonic stacks for next greater elements, daily temperatures, valid parentheses, and sliding window maximums.", "slots": 5, "order": 6},
            {"name": "Dynamic Programming", "description": "1D/2D memoization and tabulation: climbing stairs, house robber, coin change, LIS, and 0/1 knapsack.", "slots": 5, "order": 7},
            {"name": "Graph", "description": "BFS/DFS traversals: number of islands, shortest unweighted paths, cycle detection, and topological course schedules.", "slots": 5, "order": 8}
        ]

        algo_map = {}
        for item in algorithms_data:
            algo, _ = Algorithm.objects.update_or_create(
                name=item["name"],
                defaults={
                    "slug": slugify(item["name"]),
                    "description": item["description"],
                    "difficulty": "Medium",
                    "total_slots": item["slots"],
                    "order": item["order"],
                    "is_active": True
                }
            )
            algo_map[item["name"]] = algo
            self.stdout.write(f"Algorithm Topic ready: {algo.name} ({algo.total_slots} slots)")

        # 3. Comprehensive Medium Problem Bank (5 per category = 40 problems total)
        medium_problems = [
            # --- 1. SORTING ---
            {
                "title": "Minimum Difference Pair", "slug": "sorting-min-diff-pair", "algorithm": algo_map["Sorting"],
                "description": "Given an array of N integers, find the minimum absolute difference between any two different elements.",
                "input_format": "First line: N\nSecond line: N space-separated integers", "output_format": "Print the minimum absolute difference.",
                "constraints": "2 <= N <= 2 * 10^5\n-10^9 <= A[i] <= 10^9",
                "sample_test_cases": [{"input": "5\n10 3 8 20 15", "output": "2", "explanation": "Absolute difference between 10 and 8 is 2."}],
                "hidden_test_cases": [{"input": "4\n1 5 3 19", "output": "2"}, {"input": "3\n100 200 150", "output": "50"}, {"input": "2\n10 20", "output": "10"}]
            },
            {
                "title": "Sort by Frequency", "slug": "sorting-sort-by-frequency", "algorithm": algo_map["Sorting"],
                "description": "Given an array, sort its elements by decreasing frequency. If two numbers have the same frequency, the smaller number must appear first.",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print space-separated sorted integers.",
                "constraints": "1 <= N <= 2 * 10^5",
                "sample_test_cases": [{"input": "8\n4 4 1 2 2 2 3 1", "output": "2 2 2 1 1 4 4 3"}],
                "hidden_test_cases": [{"input": "5\n5 5 4 4 3", "output": "4 4 5 5 3"}, {"input": "3\n1 2 3", "output": "1 2 3"}]
            },
            {
                "title": "Merge Overlapping Intervals", "slug": "sorting-merge-overlapping-intervals", "algorithm": algo_map["Sorting"],
                "description": "Given N intervals [start, end], merge all overlapping intervals and print the resulting intervals in sorted order.",
                "input_format": "First line: N\nNext N lines: start end", "output_format": "Print each merged interval on a new line.",
                "constraints": "1 <= N <= 10^5\n0 <= start <= end <= 10^9",
                "sample_test_cases": [{"input": "4\n1 3\n2 6\n8 10\n9 12", "output": "1 6\n8 12"}],
                "hidden_test_cases": [{"input": "2\n1 4\n4 5", "output": "1 5"}, {"input": "3\n1 2\n3 4\n5 6", "output": "1 2\n3 4\n5 6"}]
            },
            {
                "title": "Largest Possible Number", "slug": "sorting-largest-possible-number", "algorithm": algo_map["Sorting"],
                "description": "Given N non-negative integers, arrange them so that they form the largest possible number when concatenated.",
                "input_format": "First line: N\nSecond line: N space-separated integers", "output_format": "Print the largest concatenated number string.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "5\n3 30 34 5 9", "output": "9534330"}],
                "hidden_test_cases": [{"input": "2\n10 2", "output": "210"}, {"input": "3\n0 0 0", "output": "0"}]
            },
            {
                "title": "Sort by Distance", "slug": "sorting-sort-by-distance", "algorithm": algo_map["Sorting"],
                "description": "Given an integer X and an array, sort the elements by their absolute distance from X. If two elements have the same distance, place the smaller element first.",
                "input_format": "First line: N X\nSecond line: N integers", "output_format": "Print the sorted array.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6 10\n12 5 8 15 10 7", "output": "10 8 12 7 5 15"}],
                "hidden_test_cases": [{"input": "4 5\n1 2 3 4", "output": "4 3 2 1"}]
            },

            # --- 2. BINARY SEARCH ---
            {
                "title": "First Position of Target", "slug": "bs-first-position-of-target", "algorithm": algo_map["Binary Search"],
                "description": "Given a sorted array of N integers and a target value, find the 0-based first position where target occurs. Print -1 if not found.",
                "input_format": "First line: N\nSecond line: N integers\nThird line: target", "output_format": "Print index or -1.",
                "constraints": "1 <= N <= 2 * 10^5",
                "sample_test_cases": [{"input": "7\n1 2 2 2 5 7 9\n2", "output": "1"}],
                "hidden_test_cases": [{"input": "5\n1 3 5 7 9\n6", "output": "-1"}, {"input": "3\n4 4 4\n4", "output": "0"}]
            },
            {
                "title": "Minimum Eating Speed", "slug": "bs-minimum-eating-speed", "algorithm": algo_map["Binary Search"],
                "description": "There are N piles of items. A machine processes K items per hour. Find the minimum integer speed K such that all items can be processed within H hours.",
                "input_format": "First line: N H\nSecond line: N integers", "output_format": "Print minimum speed K.",
                "constraints": "1 <= N <= 10^5\nN <= H <= 10^9",
                "sample_test_cases": [{"input": "4 8\n3 6 7 11", "output": "4"}],
                "hidden_test_cases": [{"input": "5 5\n30 11 23 4 20", "output": "30"}, {"input": "5 6\n30 11 23 4 20", "output": "23"}]
            },
            {
                "title": "Allocate Books", "slug": "bs-allocate-books", "algorithm": algo_map["Binary Search"],
                "description": "Given N books with page counts and K students, allocate consecutive books to students such that the maximum pages assigned to any student is minimized.",
                "input_format": "First line: N K\nSecond line: N integers", "output_format": "Print minimized maximum pages.",
                "constraints": "1 <= N <= 10^5\n1 <= K <= N",
                "sample_test_cases": [{"input": "4 2\n10 20 30 40", "output": "60"}],
                "hidden_test_cases": [{"input": "4 2\n12 34 67 90", "output": "113"}, {"input": "3 1\n10 20 30", "output": "60"}]
            },
            {
                "title": "Search in Rotated Sorted Array", "slug": "bs-search-rotated-sorted-array", "algorithm": algo_map["Binary Search"],
                "description": "A sorted array with distinct values has been rotated at an unknown pivot. Find the 0-based index of target value X, or -1 if not present.",
                "input_format": "First line: N\nSecond line: N integers\nThird line: X", "output_format": "Print index or -1.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "7\n4 5 6 7 0 1 2\n0", "output": "4"}],
                "hidden_test_cases": [{"input": "7\n4 5 6 7 0 1 2\n3", "output": "-1"}, {"input": "1\n1\n0", "output": "-1"}]
            },
            {
                "title": "Aggressive Placement", "slug": "bs-aggressive-placement", "algorithm": algo_map["Binary Search"],
                "description": "Given N positions and K objects, place the objects such that the minimum distance between any two objects is maximized.",
                "input_format": "First line: N K\nSecond line: N space-separated coordinates", "output_format": "Print the maximum possible minimum distance.",
                "constraints": "2 <= K <= N <= 10^5",
                "sample_test_cases": [{"input": "5 3\n1 2 4 8 9", "output": "3"}],
                "hidden_test_cases": [{"input": "5 2\n1 2 8 4 9", "output": "8"}]
            },

            # --- 3. HASHING ---
            {
                "title": "Longest Consecutive Sequence", "slug": "hashing-longest-consecutive-sequence", "algorithm": algo_map["Hashing"],
                "description": "Given an unsorted array of integers, find the length of the longest sequence of consecutive numbers in O(N) time.",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print length of longest consecutive sequence.",
                "constraints": "0 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n100 4 200 1 3 2", "output": "4"}],
                "hidden_test_cases": [{"input": "10\n0 3 7 2 5 8 4 6 0 1", "output": "9"}, {"input": "1\n10", "output": "1"}]
            },
            {
                "title": "Subarray Sum Equals K", "slug": "hashing-subarray-sum-equals-k", "algorithm": algo_map["Hashing"],
                "description": "Given an integer array and K, count the total number of continuous subarrays whose sum equals K.",
                "input_format": "First line: N K\nSecond line: N integers", "output_format": "Print count of matching subarrays.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "5 3\n1 2 1 1 1", "output": "3"}],
                "hidden_test_cases": [{"input": "3 2\n1 1 1", "output": "2"}, {"input": "3 3\n1 2 3", "output": "2"}]
            },
            {
                "title": "Longest Subarray With Sum Zero", "slug": "hashing-longest-subarray-sum-zero", "algorithm": algo_map["Hashing"],
                "description": "Given an array of integers, find the length of the longest continuous subarray whose sum is zero.",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print the maximum length (or 0).",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n15 -2 2 -8 1 7", "output": "5"}],
                "hidden_test_cases": [{"input": "5\n1 2 3 4 5", "output": "0"}, {"input": "4\n1 -1 1 -1", "output": "4"}]
            },
            {
                "title": "First Unique Character", "slug": "hashing-first-unique-character", "algorithm": algo_map["Hashing"],
                "description": "Given a lowercase string, find the 0-based index of the first character that occurs exactly once. Return -1 if none.",
                "input_format": "A single line string S", "output_format": "Print index or -1.",
                "constraints": "1 <= S.length <= 10^5",
                "sample_test_cases": [{"input": "swiss", "output": "1"}],
                "hidden_test_cases": [{"input": "leetcode", "output": "0"}, {"input": "aabb", "output": "-1"}]
            },
            {
                "title": "Equal Frequency Subarrays", "slug": "hashing-equal-frequency-subarrays", "algorithm": algo_map["Hashing"],
                "description": "Given an array of positive integers, find the maximum length of a contiguous subarray containing equal counts of even and odd numbers.",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print maximum length.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n2 5 4 7 8 9", "output": "6"}],
                "hidden_test_cases": [{"input": "4\n1 3 5 7", "output": "0"}, {"input": "4\n2 4 6 1", "output": "2"}]
            },

            # --- 4. TWO POINTERS / SLIDING WINDOW ---
            {
                "title": "Longest Subarray At Most K Distinct", "slug": "tp-longest-subarray-k-distinct", "algorithm": algo_map["Two Pointers"],
                "description": "Given an array and K, find the length of the longest contiguous subarray containing at most K distinct values.",
                "input_format": "First line: N K\nSecond line: N integers", "output_format": "Print longest length.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "7 2\n1 2 1 2 3 2 2", "output": "4"}],
                "hidden_test_cases": [{"input": "5 1\n1 1 1 1 1", "output": "5"}, {"input": "3 2\n1 2 3", "output": "2"}]
            },
            {
                "title": "Longest Substring Without Repeating", "slug": "tp-longest-substring-without-repeating", "algorithm": algo_map["Two Pointers"],
                "description": "Given a string S, find the length of the longest substring without repeating characters.",
                "input_format": "A single line string S", "output_format": "Print maximum length.",
                "constraints": "1 <= S.length <= 10^5",
                "sample_test_cases": [{"input": "abcabcbb", "output": "3"}],
                "hidden_test_cases": [{"input": "bbbbb", "output": "1"}, {"input": "pwwkew", "output": "3"}]
            },
            {
                "title": "Max Consecutive Ones With K Changes", "slug": "tp-max-consecutive-ones-k-changes", "algorithm": algo_map["Two Pointers"],
                "description": "Given a binary array and K, you may change at most K zeroes to ones. Return the maximum number of consecutive 1s.",
                "input_format": "First line: N K\nSecond line: N binary integers (0 or 1)", "output_format": "Print maximum consecutive ones.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "7 2\n1 1 0 0 1 1 1", "output": "5"}],
                "hidden_test_cases": [{"input": "5 1\n0 0 1 1 0", "output": "3"}]
            },
            {
                "title": "Container With Most Water", "slug": "tp-container-with-most-water", "algorithm": algo_map["Two Pointers"],
                "description": "Given N non-negative vertical line heights, choose two lines that hold the maximum area of water together with the x-axis.",
                "input_format": "First line: N\nSecond line: N space-separated heights", "output_format": "Print maximum water area.",
                "constraints": "2 <= N <= 10^5",
                "sample_test_cases": [{"input": "9\n1 8 6 2 5 4 8 3 7", "output": "49"}],
                "hidden_test_cases": [{"input": "2\n1 1", "output": "1"}, {"input": "4\n4 3 2 1", "output": "4"}]
            },
            {
                "title": "Count Subarrays Sum At Most K", "slug": "tp-count-subarrays-sum-at-most-k", "algorithm": algo_map["Two Pointers"],
                "description": "Given an array of non-negative integers and K, count the number of contiguous subarrays whose sum is at most K.",
                "input_format": "First line: N K\nSecond line: N non-negative integers", "output_format": "Print count of subarrays.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "4 5\n1 2 1 3", "output": "8"}],
                "hidden_test_cases": [{"input": "3 0\n0 0 0", "output": "6"}, {"input": "3 1\n2 3 4", "output": "0"}]
            },

            # --- 5. GREEDY ---
            {
                "title": "Activity Selection Maximizer", "slug": "greedy-activity-selection-maximizer", "algorithm": algo_map["Greedy"],
                "description": "Given N activities with start and finish times, select the maximum number of non-overlapping activities that can be performed by a single person.",
                "input_format": "First line: N\nNext N lines: start finish", "output_format": "Print the maximum count.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9", "output": "4"}],
                "hidden_test_cases": [{"input": "3\n10 20\n12 25\n20 30", "output": "2"}]
            },
            {
                "title": "Minimum Number of Platforms", "slug": "greedy-min-platforms", "algorithm": algo_map["Greedy"],
                "description": "Given arrival and departure times of trains, find the minimum number of railway platforms required so that no train is forced to wait.",
                "input_format": "First line: N\nSecond line: N arrival times\nThird line: N departure times", "output_format": "Print minimum platforms.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000", "output": "3"}],
                "hidden_test_cases": [{"input": "3\n900 1100 1235\n1000 1200 1240", "output": "1"}]
            },
            {
                "title": "Fractional Knapsack Maximizer", "slug": "greedy-fractional-knapsack", "algorithm": algo_map["Greedy"],
                "description": "Given N items with values and weights, and a knapsack capacity W, find the maximum total value possible (items can be taken fractionally). Print rounded to 2 decimal places.",
                "input_format": "First line: N W\nNext N lines: value weight", "output_format": "Print max value rounded to 2 decimal places.",
                "constraints": "1 <= N <= 10^5\n1 <= W <= 10^9",
                "sample_test_cases": [{"input": "3 50\n60 10\n100 20\n120 30", "output": "240.00"}],
                "hidden_test_cases": [{"input": "2 50\n60 10\n100 20", "output": "160.00"}]
            },
            {
                "title": "Minimum Coin Denominations", "slug": "greedy-minimum-coins", "algorithm": algo_map["Greedy"],
                "description": "Given N standard coin denominations and a target amount, find the minimum number of coins needed using the greedy denomination strategy.",
                "input_format": "First line: N\nSecond line: N space-separated coin values\nThird line: amount", "output_format": "Print minimum coins.",
                "constraints": "1 <= N <= 100",
                "sample_test_cases": [{"input": "3\n1 5 10\n28", "output": "6"}],
                "hidden_test_cases": [{"input": "4\n1 2 5 10\n39", "output": "6"}]
            },
            {
                "title": "Job Sequencing With Deadlines", "slug": "greedy-job-sequencing", "algorithm": algo_map["Greedy"],
                "description": "Given N jobs with deadlines and profits, where each job takes 1 unit of time, schedule jobs to maximize total profit.",
                "input_format": "First line: N\nNext N lines: id deadline profit", "output_format": "Print total max profit.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "4\n1 4 20\n2 1 10\n3 1 40\n4 1 30", "output": "60"}],
                "hidden_test_cases": [{"input": "5\n1 2 100\n2 1 19\n3 2 27\n4 1 25\n5 3 15", "output": "142"}]
            },

            # --- 6. STACK & QUEUE ---
            {
                "title": "Next Greater Element", "slug": "sq-next-greater-element", "algorithm": algo_map["Stack & Queue"],
                "description": "For every element in an array, find the first strictly greater element to its right. If none exists, output -1 for that element.",
                "input_format": "First line: N\nSecond line: N space-separated integers", "output_format": "Print N space-separated integers.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "4\n4 5 2 10", "output": "5 10 10 -1"}],
                "hidden_test_cases": [{"input": "4\n1 3 2 4", "output": "3 4 4 -1"}, {"input": "3\n3 2 1", "output": "-1 -1 -1"}]
            },
            {
                "title": "Valid Parentheses Checker", "slug": "sq-valid-parentheses", "algorithm": algo_map["Stack & Queue"],
                "description": "Given a string containing (), {}, and [], determine whether the bracket expression is valid and balanced. Print YES or NO.",
                "input_format": "A single line string S", "output_format": "Print YES or NO.",
                "constraints": "1 <= S.length <= 10^5",
                "sample_test_cases": [{"input": "{[()]}", "output": "YES"}],
                "hidden_test_cases": [{"input": "([)]", "output": "NO"}, {"input": "()[]{}", "output": "YES"}]
            },
            {
                "title": "Daily Temperatures Warmer Days", "slug": "sq-daily-temperatures", "algorithm": algo_map["Stack & Queue"],
                "description": "Given an array of daily temperatures, compute for each day how many days you must wait until a warmer temperature occurs. Output 0 if no warmer day.",
                "input_format": "First line: N\nSecond line: N temperatures", "output_format": "Print N space-separated waiting days.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "8\n73 74 75 71 69 72 76 73", "output": "1 1 4 2 1 1 0 0"}],
                "hidden_test_cases": [{"input": "4\n30 40 50 60", "output": "1 1 1 0"}]
            },
            {
                "title": "Largest Rectangle in Histogram", "slug": "sq-largest-rectangle-histogram", "algorithm": algo_map["Stack & Queue"],
                "description": "Given an array of non-negative bar heights representing a histogram where each bar has width 1, find the area of the largest rectangle.",
                "input_format": "First line: N\nSecond line: N heights", "output_format": "Print maximum rectangular area.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "6\n2 1 5 6 2 3", "output": "10"}],
                "hidden_test_cases": [{"input": "2\n2 4", "output": "4"}, {"input": "1\n1", "output": "1"}]
            },
            {
                "title": "Sliding Window Maximum", "slug": "sq-sliding-window-maximum", "algorithm": algo_map["Stack & Queue"],
                "description": "Given an array of N integers and a sliding window size K moving from left to right, print the maximum value in each window.",
                "input_format": "First line: N K\nSecond line: N integers", "output_format": "Print space-separated maximum values.",
                "constraints": "1 <= K <= N <= 10^5",
                "sample_test_cases": [{"input": "8 3\n1 3 -1 -3 5 3 6 7", "output": "3 3 5 5 6 7"}],
                "hidden_test_cases": [{"input": "1 1\n1", "output": "1"}]
            },

            # --- 7. DYNAMIC PROGRAMMING ---
            {
                "title": "Climbing Stairs With Variable Steps", "slug": "dp-climbing-stairs-variable", "algorithm": algo_map["Dynamic Programming"],
                "description": "You can climb 1, 2, or 3 stairs at a time. Find the total number of distinct ways to reach stair N.",
                "input_format": "A single integer N", "output_format": "Print the number of ways.",
                "constraints": "1 <= N <= 45",
                "sample_test_cases": [{"input": "5", "output": "13"}],
                "hidden_test_cases": [{"input": "1", "output": "1"}, {"input": "3", "output": "4"}, {"input": "4", "output": "7"}]
            },
            {
                "title": "House Robber Max Loot", "slug": "dp-house-robber-max-loot", "algorithm": algo_map["Dynamic Programming"],
                "description": "Given money in houses along a street, determine the maximum loot you can rob tonight without alerting neighbors (cannot rob two adjacent houses).",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print maximum amount.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "5\n2 7 9 3 1", "output": "12"}],
                "hidden_test_cases": [{"input": "4\n1 2 3 1", "output": "4"}, {"input": "1\n100", "output": "100"}]
            },
            {
                "title": "Coin Change Minimum Coins", "slug": "dp-coin-change-minimum", "algorithm": algo_map["Dynamic Programming"],
                "description": "Given coin denominations and an amount, find the fewest coins needed to make up that amount. Print -1 if impossible.",
                "input_format": "First line: N amount\nSecond line: N coin values", "output_format": "Print minimum coins or -1.",
                "constraints": "1 <= N <= 300\n0 <= amount <= 10^4",
                "sample_test_cases": [{"input": "3 11\n1 2 5", "output": "3"}],
                "hidden_test_cases": [{"input": "1 3\n2", "output": "-1"}, {"input": "1 0\n1", "output": "0"}]
            },
            {
                "title": "Longest Increasing Subsequence", "slug": "dp-longest-increasing-subsequence", "algorithm": algo_map["Dynamic Programming"],
                "description": "Find the length of the longest strictly increasing subsequence in an array of integers.",
                "input_format": "First line: N\nSecond line: N integers", "output_format": "Print length of LIS.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "8\n10 9 2 5 3 7 101 18", "output": "4"}],
                "hidden_test_cases": [{"input": "6\n0 1 0 3 2 3", "output": "4"}, {"input": "7\n7 7 7 7 7 7 7", "output": "1"}]
            },
            {
                "title": "0/1 Knapsack Problem", "slug": "dp-01-knapsack-problem", "algorithm": algo_map["Dynamic Programming"],
                "description": "Given N items with weights and values and knapsack capacity W, find the maximum value you can achieve (each item at most once).",
                "input_format": "First line: N W\nSecond line: N values\nThird line: N weights", "output_format": "Print maximum total value.",
                "constraints": "1 <= N <= 1000\n1 <= W <= 1000",
                "sample_test_cases": [{"input": "3 4\n1 2 3\n4 5 1", "output": "3"}],
                "hidden_test_cases": [{"input": "3 3\n1 2 3\n4 5 6", "output": "0"}]
            },

            # --- 8. GRAPH ---
            {
                "title": "Number of Islands", "slug": "graph-number-of-islands", "algorithm": algo_map["Graph"],
                "description": "Given an R x C 2D grid containing '1's (land) and '0's (water), count the number of connected islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.",
                "input_format": "First line: R C\nNext R lines: C space-separated characters (0 or 1)", "output_format": "Print the number of islands.",
                "constraints": "1 <= R, C <= 300",
                "sample_test_cases": [{"input": "4 5\n1 1 0 0 0\n1 1 0 1 0\n0 0 1 0 0\n0 0 0 1 1", "output": "4"}],
                "hidden_test_cases": [{"input": "3 3\n1 1 1\n0 1 0\n1 1 1", "output": "1"}]
            },
            {
                "title": "Shortest Path in Unweighted Graph", "slug": "graph-shortest-path-unweighted", "algorithm": algo_map["Graph"],
                "description": "Given an unweighted undirected graph with V vertices (0 to V-1) and E edges, find the shortest distance in edges from vertex S to vertex T. Print -1 if unreachable.",
                "input_format": "First line: V E S T\nNext E lines: u v", "output_format": "Print shortest distance or -1.",
                "constraints": "1 <= V <= 10^5\n0 <= E <= 2*10^5",
                "sample_test_cases": [{"input": "4 4 0 3\n0 1\n1 2\n2 3\n0 3", "output": "1"}],
                "hidden_test_cases": [{"input": "3 1 0 2\n0 1", "output": "-1"}]
            },
            {
                "title": "Detect Cycle in Undirected Graph", "slug": "graph-detect-cycle-undirected", "algorithm": algo_map["Graph"],
                "description": "Given an undirected graph with V vertices and E edges, determine whether it contains a cycle. Print YES or NO.",
                "input_format": "First line: V E\nNext E lines: u v", "output_format": "Print YES or NO.",
                "constraints": "1 <= V <= 10^5",
                "sample_test_cases": [{"input": "4 4\n0 1\n1 2\n2 3\n3 0", "output": "YES"}],
                "hidden_test_cases": [{"input": "3 2\n0 1\n1 2", "output": "NO"}]
            },
            {
                "title": "Course Schedule Feasibility", "slug": "graph-course-schedule-feasibility", "algorithm": algo_map["Graph"],
                "description": "There are N courses labeled 0 to N-1. Some courses have prerequisites. Determine if it is possible to finish all courses (detect cycle in directed graph). Print YES or NO.",
                "input_format": "First line: N P (courses, prerequisite count)\nNext P lines: u v (course u requires v)", "output_format": "Print YES or NO.",
                "constraints": "1 <= N <= 10^5",
                "sample_test_cases": [{"input": "2 1\n1 0", "output": "YES"}],
                "hidden_test_cases": [{"input": "2 2\n1 0\n0 1", "output": "NO"}]
            },
            {
                "title": "Minimum Spanning Tree Cost", "slug": "graph-mst-cost", "algorithm": algo_map["Graph"],
                "description": "Given a connected weighted undirected graph with V vertices and E edges, find the total minimum cost needed to connect all vertices into a spanning tree.",
                "input_format": "First line: V E\nNext E lines: u v weight", "output_format": "Print minimum total weight.",
                "constraints": "1 <= V <= 10^5\n1 <= E <= 2*10^5",
                "sample_test_cases": [{"input": "3 3\n0 1 5\n1 2 10\n0 2 6", "output": "11"}],
                "hidden_test_cases": [{"input": "2 1\n0 1 100", "output": "100"}]
            }
        ]

        for p in medium_problems:
            prob, _ = Problem.objects.update_or_create(
                slug=p["slug"],
                defaults={
                    "title": p["title"],
                    "difficulty": "MEDIUM",
                    "algorithm": p["algorithm"],
                    "description": p["description"],
                    "input_format": p["input_format"],
                    "output_format": p["output_format"],
                    "constraints": p["constraints"],
                    "sample_test_cases": p["sample_test_cases"],
                    "hidden_test_cases": p["hidden_test_cases"],
                    "is_active": True
                }
            )
            self.stdout.write(f"Medium Problem: {prob.title} [{prob.algorithm.name}]")

        # 4. Comprehensive Easy Random Problems Bank (20 Easy Problems)
        easy_problems = [
            {"title": "Sum of Array Elements", "slug": "easy-sum-of-array", "desc": "Given N integers, compute and print their total sum.", "in": "First line: N\nSecond line: N integers", "out": "Print total sum.", "samples": [{"input": "4\n1 2 3 4", "output": "10"}], "hidden": [{"input": "3\n-1 0 1", "output": "0"}]},
            {"title": "Maximum Element in Array", "slug": "easy-maximum-element", "desc": "Given an array of N integers, find and print the largest element.", "in": "First line: N\nSecond line: N integers", "out": "Print the maximum value.", "samples": [{"input": "5\n10 45 2 89 12", "output": "89"}], "hidden": [{"input": "2\n-5 -2", "output": "-2"}]},
            {"title": "Count Even Numbers", "slug": "easy-count-even-numbers", "desc": "Given an array of N integers, count how many numbers are even.", "in": "First line: N\nSecond line: N integers", "out": "Print count of even numbers.", "samples": [{"input": "5\n1 2 3 4 6", "output": "3"}], "hidden": [{"input": "3\n1 3 5", "output": "0"}]},
            {"title": "Reverse a String", "slug": "easy-reverse-a-string", "desc": "Given a string S, print it in reverse order.", "in": "A single line string S", "out": "Print reversed string.", "samples": [{"input": "hello", "output": "olleh"}], "hidden": [{"input": "ieee", "output": "eeei"}]},
            {"title": "Palindrome String", "slug": "easy-palindrome-string", "desc": "Check whether a string reads the same forward and backward. Print true or false.", "in": "A single line string S", "out": "Print true or false.", "samples": [{"input": "racecar", "output": "true"}], "hidden": [{"input": "hello", "output": "false"}]},
            {"title": "Count Vowels", "slug": "easy-count-vowels", "desc": "Given a lowercase string, count the total number of vowels (a, e, i, o, u).", "in": "A single line string S", "out": "Print vowel count.", "samples": [{"input": "computer", "output": "3"}], "hidden": [{"input": "xyz", "output": "0"}]},
            {"title": "Second Largest Element", "slug": "easy-second-largest-element", "desc": "Find the second largest distinct integer in an array. Print -1 if no second largest exists.", "in": "First line: N\nSecond line: N integers", "out": "Print second largest or -1.", "samples": [{"input": "5\n12 35 1 10 34", "output": "34"}], "hidden": [{"input": "2\n10 10", "output": "-1"}]},
            {"title": "Remove Duplicates from Array", "slug": "easy-remove-duplicates", "desc": "Given an array of integers, print all unique elements in the order of their first appearance.", "in": "First line: N\nSecond line: N integers", "out": "Print space-separated distinct integers.", "samples": [{"input": "6\n1 2 2 3 4 4", "output": "1 2 3 4"}], "hidden": [{"input": "3\n5 5 5", "output": "5"}]},
            {"title": "Factorial of Number", "slug": "easy-factorial-number", "desc": "Given an integer N, calculate and print N! (factorial).", "in": "A single integer N", "out": "Print N!", "samples": [{"input": "5", "output": "120"}], "hidden": [{"input": "0", "output": "1"}, {"input": "6", "output": "720"}]},
            {"title": "Nth Fibonacci Number", "slug": "easy-fibonacci-number", "desc": "Given N (0-indexed, where F(0)=0, F(1)=1), print the Nth Fibonacci number.", "in": "A single integer N", "out": "Print F(N).", "samples": [{"input": "6", "output": "8"}], "hidden": [{"input": "0", "output": "0"}, {"input": "1", "output": "1"}]},
            {"title": "Prime Number Check", "slug": "easy-prime-check", "desc": "Given an integer N > 1, print true if N is prime, otherwise false.", "in": "A single integer N", "out": "Print true or false.", "samples": [{"input": "7", "output": "true"}], "hidden": [{"input": "4", "output": "false"}, {"input": "13", "output": "true"}]},
            {"title": "Count Digits", "slug": "easy-count-digits", "desc": "Given an integer N, print the number of digits in N.", "in": "A single integer N", "out": "Print digit count.", "samples": [{"input": "12345", "output": "5"}], "hidden": [{"input": "0", "output": "1"}]},
            {"title": "Armstrong Number Check", "slug": "easy-armstrong-number", "desc": "Check if a 3-digit number is an Armstrong number (sum of cubes of digits equals the number). Print true or false.", "in": "A 3-digit integer N", "out": "Print true or false.", "samples": [{"input": "153", "output": "true"}], "hidden": [{"input": "123", "output": "false"}]},
            {"title": "GCD of Two Numbers", "slug": "easy-gcd-two-numbers", "desc": "Find the greatest common divisor (GCD) of two positive integers A and B.", "in": "Two space-separated integers A B", "out": "Print GCD.", "samples": [{"input": "12 18", "output": "6"}], "hidden": [{"input": "5 7", "output": "1"}]},
            {"title": "LCM of Two Numbers", "slug": "easy-lcm-two-numbers", "desc": "Find the least common multiple (LCM) of two positive integers A and B.", "in": "Two space-separated integers A B", "out": "Print LCM.", "samples": [{"input": "4 6", "output": "12"}], "hidden": [{"input": "3 5", "output": "15"}]},
            {"title": "Character Frequency Counter", "slug": "easy-char-frequency", "desc": "Given a lowercase string, print each character and its count in sorted alphabetical order format 'c:count'.", "in": "A single line string S", "out": "Print space-separated char:count pairs.", "samples": [{"input": "tree", "output": "e:2 r:1 t:1"}], "hidden": [{"input": "a", "output": "a:1"}]},
            {"title": "Move Zeroes to End", "slug": "easy-move-zeroes", "desc": "Move all zeroes to the end of the array while maintaining the relative order of non-zero elements.", "in": "First line: N\nSecond line: N integers", "out": "Print space-separated modified array.", "samples": [{"input": "5\n0 1 0 3 12", "output": "1 3 12 0 0"}], "hidden": [{"input": "2\n0 0", "output": "0 0"}]},
            {"title": "Linear Search Target", "slug": "easy-linear-search", "desc": "Given an array and target X, print the 0-based first index of X or -1 if not found.", "in": "First line: N X\nSecond line: N integers", "out": "Print index or -1.", "samples": [{"input": "5 30\n10 20 30 40 50", "output": "2"}], "hidden": [{"input": "3 99\n1 2 3", "output": "-1"}]},
            {"title": "Sum of Digits", "slug": "easy-sum-of-digits", "desc": "Given a non-negative integer N, calculate and print the sum of its digits.", "in": "A single non-negative integer N", "out": "Print sum of digits.", "samples": [{"input": "456", "output": "15"}], "hidden": [{"input": "100", "output": "1"}]},
            {"title": "FizzBuzz Sequence", "slug": "easy-fizzbuzz-sequence", "desc": "For numbers 1 through N: print 'FizzBuzz' if divisible by 3 and 5, 'Fizz' if divisible by 3, 'Buzz' if divisible by 5, otherwise the number. Each on a new line.", "in": "A single integer N", "out": "Print N lines.", "samples": [{"input": "5", "output": "1\n2\nFizz\n4\nBuzz"}], "hidden": [{"input": "3", "output": "1\n2\nFizz"}]}
        ]

        for ep in easy_problems:
            prob, _ = Problem.objects.update_or_create(
                slug=ep["slug"],
                defaults={
                    "title": ep["title"],
                    "difficulty": "EASY",
                    "algorithm": None,
                    "description": ep["desc"],
                    "input_format": ep["in"],
                    "output_format": ep["out"],
                    "constraints": "1 <= N <= 10^5",
                    "sample_test_cases": ep["samples"],
                    "hidden_test_cases": ep["hidden"],
                    "is_active": True
                }
            )
            self.stdout.write(f"Easy Problem: {prob.title} [General Pool]")

        # 5. Create 40 Demo Participants
        self.stdout.write("Ensuring 40 demo participants...")
        for i in range(1, 41):
            anon_label = f"P{i:02d}"
            username = f"participant_{i:02d}"
            email = f"p{i:02d}@bit2code.ieee.org"
            
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': email}
            )
            user.set_password("bit2code2026")
            user.save()

            Participant.objects.update_or_create(
                user=user,
                defaults={
                    "anonymous_label": anon_label,
                    "name": f"Competitor {i:02d}",
                    "email": email,
                    "balance": 1000,
                    "is_active_participant": True
                }
            )

        self.stdout.write(self.style.SUCCESS(f"\nSUCCESS! Seeded 40 Medium Problems + 20 Easy Problems across all 8 Categories."))
