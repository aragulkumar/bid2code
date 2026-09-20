from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.text import slugify
from competitions.models import Algorithm, Participant, Problem

class Command(BaseCommand):
    help = 'Seeds initial algorithms, problems (Easy + Medium), test cases, admin account, and demo participants.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Seeding BIT2CODE event data..."))

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
            self.stdout.write(self.style.SUCCESS("Created admin user: admin / admin123"))

        # 2. Create Algorithms (8 Medium algorithms, 5 slots each = 40 total slots)
        algorithms_data = [
            {
                "name": "Dynamic Programming",
                "description": "Optimize recursive subproblems with memoization and tabulation techniques.",
                "slots": 5,
                "order": 1
            },
            {
                "name": "Graph",
                "description": "Traversals, shortest paths, cycles, and connectivity on directed and undirected graphs.",
                "slots": 5,
                "order": 2
            },
            {
                "name": "Trees",
                "description": "Binary search trees, traversals, lowest common ancestors, and depth computations.",
                "slots": 5,
                "order": 3
            },
            {
                "name": "Greedy",
                "description": "Locally optimal choices that lead to globally optimal solutions.",
                "slots": 5,
                "order": 4
            },
            {
                "name": "Binary Search",
                "description": "Logarithmic search over sorted ranges, monotonic functions, and answer spaces.",
                "slots": 5,
                "order": 5
            },
            {
                "name": "Hashing",
                "description": "O(1) lookups, frequency maps, prefix sum hashing, and anagram groupings.",
                "slots": 5,
                "order": 6
            },
            {
                "name": "Two Pointers",
                "description": "Sliding windows, left/right meeting pointers, and partitioned subarray sweeps.",
                "slots": 5,
                "order": 7
            },
            {
                "name": "Stack & Queue",
                "description": "Monotonic stacks, parentheses balancing, sliding window maximums, and BFS queues.",
                "slots": 5,
                "order": 8
            }
        ]

        algo_objs = {}
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
            algo_objs[item["name"]] = algo
            self.stdout.write(f"Algorithm ready: {algo.name} ({algo.total_slots} slots)")

        # 3. Create Problems with real test cases
        problems_data = [
            # --- MEDIUM ALGORITHM PROBLEMS ---
            {
                "title": "Coin Change Ways",
                "slug": "coin-change-ways",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Dynamic Programming"],
                "description": "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the number of combinations that make up that amount. If that amount of money cannot be made up by any combination of the coins, return 0.\n\nYou may assume that you have an infinite number of each kind of coin.",
                "input_format": "First line contains integer N (number of coins) and amount separated by space.\nSecond line contains N space-separated coin values.",
                "output_format": "Print the total number of combinations.",
                "constraints": "1 <= coins.length <= 300\n1 <= coins[i] <= 5000\n0 <= amount <= 5000",
                "sample_test_cases": [
                    {"input": "3 5\n1 2 5", "output": "4", "explanation": "5=5, 5=2+2+1, 5=2+1+1+1, 5=1+1+1+1+1"},
                    {"input": "3 3\n2 4 6", "output": "0", "explanation": "Cannot make amount 3 with even coins"}
                ],
                "hidden_test_cases": [
                    {"input": "1 10\n10", "output": "1"},
                    {"input": "4 10\n2 5 3 6", "output": "5"},
                    {"input": "3 12\n1 5 10", "output": "4"}
                ]
            },
            {
                "title": "Shortest Path in Network",
                "slug": "shortest-path-in-network",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Graph"],
                "description": "Given an unweighted undirected graph with `V` vertices (0 to V-1) and `E` edges, find the length of the shortest path from vertex `S` to vertex `D` (number of edges). If no path exists, return -1.",
                "input_format": "First line: V E S D\nNext E lines: u v (edges)",
                "output_format": "Print the shortest distance or -1.",
                "constraints": "1 <= V <= 10^4\n0 <= E <= 2*10^4",
                "sample_test_cases": [
                    {"input": "4 4 0 3\n0 1\n1 2\n2 3\n0 3", "output": "1", "explanation": "Direct edge 0-3 has distance 1."},
                    {"input": "3 1 0 2\n0 1", "output": "-1", "explanation": "Vertex 2 is unreachable."}
                ],
                "hidden_test_cases": [
                    {"input": "5 5 0 4\n0 1\n1 2\n2 3\n3 4\n0 4", "output": "1"},
                    {"input": "6 6 0 5\n0 1\n1 2\n2 3\n3 4\n4 5\n0 2", "output": "4"}
                ]
            },
            {
                "title": "Lowest Common Ancestor in BST",
                "slug": "lowest-common-ancestor-in-bst",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Trees"],
                "description": "Given a Binary Search Tree (BST) represented as an array in level-order and two node values `p` and `q`, find the lowest common ancestor (LCA) value of the two given nodes.",
                "input_format": "First line: space-separated integers representing BST values in sorted order\nSecond line: two integers p and q",
                "output_format": "Print the integer value of the LCA.",
                "constraints": "Node values are unique.\n2 <= number of nodes <= 10^5",
                "sample_test_cases": [
                    {"input": "2 3 4 5 6 7 8\n2 8", "output": "5", "explanation": "Root 5 is LCA of 2 and 8 in balanced BST."},
                    {"input": "2 4 6\n2 4", "output": "4", "explanation": "LCA of 2 and 4."}
                ],
                "hidden_test_cases": [
                    {"input": "1 2 3 4 5\n1 5", "output": "3"},
                    {"input": "10 20 30\n10 20", "output": "20"}
                ]
            },
            {
                "title": "Activity Selection Maximizer",
                "slug": "activity-selection-maximizer",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Greedy"],
                "description": "Given `N` activities with start times and finish times, select the maximum number of activities that can be performed by a single person, assuming that a person can only work on a single activity at a time.",
                "input_format": "First line: N\nNext N lines: start finish",
                "output_format": "Print the maximum count of non-overlapping activities.",
                "constraints": "1 <= N <= 10^5\n0 <= start < finish <= 10^9",
                "sample_test_cases": [
                    {"input": "6\n1 2\n3 4\n0 6\n5 7\n8 9\n5 9", "output": "4", "explanation": "Activities (1,2), (3,4), (5,7), (8,9) can be selected."},
                    {"input": "3\n10 20\n12 25\n20 30", "output": "2", "explanation": "Select (10,20) and (20,30)"}
                ],
                "hidden_test_cases": [
                    {"input": "4\n1 3\n2 4\n3 5\n4 6", "output": "2"},
                    {"input": "1\n5 10", "output": "1"}
                ]
            },
            {
                "title": "Allocate Minimum Pages",
                "slug": "allocate-minimum-pages",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Binary Search"],
                "description": "You are given an array of `N` books where the i-th book has `pages[i]` pages. There are `M` students. Allocate all books to students such that each student gets at least one book, book allocation is contiguous, and the maximum number of pages allocated to any student is minimized. Return the minimized maximum pages, or -1 if allocation is impossible.",
                "input_format": "First line: N M\nSecond line: space-separated book page counts",
                "output_format": "Print the minimum possible maximum page allocation.",
                "constraints": "1 <= N <= 10^5\n1 <= M <= N\n1 <= pages[i] <= 10^4",
                "sample_test_cases": [
                    {"input": "4 2\n12 34 67 90", "output": "113", "explanation": "Student 1: [12, 34, 67] (113 pages), Student 2: [90] (90 pages). Max is 113."},
                    {"input": "3 4\n10 20 30", "output": "-1", "explanation": "More students than books."}
                ],
                "hidden_test_cases": [
                    {"input": "5 3\n10 20 30 40 50", "output": "60"},
                    {"input": "4 1\n5 15 25 35", "output": "80"}
                ]
            },
            {
                "title": "Longest Subarray with Sum K",
                "slug": "longest-subarray-with-sum-k",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Hashing"],
                "description": "Given an array `arr` of `N` integers and an integer `K`, find the length of the longest subarray with sum equal to `K`. If no such subarray exists, return 0.",
                "input_format": "First line: N K\nSecond line: space-separated integers",
                "output_format": "Print the length of the longest subarray.",
                "constraints": "1 <= N <= 10^5\n-10^4 <= arr[i], K <= 10^4",
                "sample_test_cases": [
                    {"input": "6 15\n10 5 2 7 1 9", "output": "4", "explanation": "Subarray [5, 2, 7, 1] has sum 15 with length 4."},
                    {"input": "3 5\n1 2 3", "output": "2", "explanation": "Subarray [2, 3] has sum 5 with length 2."}
                ],
                "hidden_test_cases": [
                    {"input": "5 0\n1 -1 2 -2 3", "output": "4"},
                    {"input": "4 10\n1 2 3 4", "output": "4"}
                ]
            },
            {
                "title": "Trapping Rain Water",
                "slug": "trapping-rain-water",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Two Pointers"],
                "description": "Given `N` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining using an efficient Two Pointers approach.",
                "input_format": "First line: N\nSecond line: N space-separated bar heights",
                "output_format": "Print total units of trapped rainwater.",
                "constraints": "1 <= N <= 10^5\n0 <= height[i] <= 10^4",
                "sample_test_cases": [
                    {"input": "12\n0 1 0 2 1 0 1 3 2 1 2 1", "output": "6", "explanation": "Total 6 units of water trapped."},
                    {"input": "6\n4 2 0 3 2 5", "output": "9", "explanation": "Total 9 units of water trapped."}
                ],
                "hidden_test_cases": [
                    {"input": "5\n3 0 0 0 3", "output": "9"},
                    {"input": "3\n2 0 2", "output": "2"},
                    {"input": "3\n1 2 3", "output": "0"}
                ]
            },
            {
                "title": "Next Greater Element",
                "slug": "next-greater-element",
                "difficulty": "MEDIUM",
                "algorithm": algo_objs["Stack & Queue"],
                "description": "Given an array `arr` of `N` integers, find the next greater element for each element in order of their appearance in the array. If no greater element exists, output -1 for that position.",
                "input_format": "First line: N\nSecond line: N space-separated integers",
                "output_format": "Print N space-separated integers representing next greater elements.",
                "constraints": "1 <= N <= 10^5\n1 <= arr[i] <= 10^6",
                "sample_test_cases": [
                    {"input": "4\n1 3 2 4", "output": "3 4 4 -1", "explanation": "Next greater for 1 is 3, for 3 is 4, for 2 is 4, for 4 is -1."},
                    {"input": "3\n6 8 0 1 3", "output": "8 -1 1 3 -1", "explanation": "Next greater lookup."}
                ],
                "hidden_test_cases": [
                    {"input": "4\n4 3 2 1", "output": "-1 -1 -1 -1"},
                    {"input": "4\n1 2 3 4", "output": "2 3 4 -1"}
                ]
            },

            # --- EASY GENERAL PROBLEMS BANK ---
            {
                "title": "Valid Anagram Checker",
                "slug": "valid-anagram-checker",
                "difficulty": "EASY",
                "algorithm": None,
                "description": "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. Case-sensitive.",
                "input_format": "First line: string s\nSecond line: string t",
                "output_format": "Print true or false.",
                "constraints": "1 <= s.length, t.length <= 5*10^4",
                "sample_test_cases": [
                    {"input": "anagram\nnagaram", "output": "true", "explanation": "Letters match in frequency."},
                    {"input": "rat\ncar", "output": "false", "explanation": "Letters differ."}
                ],
                "hidden_test_cases": [
                    {"input": "listen\nsilent", "output": "true"},
                    {"input": "hello\nworld", "output": "false"},
                    {"input": "a\na", "output": "true"}
                ]
            },
            {
                "title": "Palindrome String",
                "slug": "palindrome-string",
                "difficulty": "EASY",
                "algorithm": None,
                "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Return `true` if palindrome, `false` otherwise.",
                "input_format": "A single line string S",
                "output_format": "Print true or false.",
                "constraints": "1 <= S.length <= 2 * 10^5",
                "sample_test_cases": [
                    {"input": "A man, a plan, a canal: Panama", "output": "true", "explanation": "amanaplanacanalpanama is a palindrome."},
                    {"input": "race a car", "output": "false", "explanation": "raceacar is not a palindrome."}
                ],
                "hidden_test_cases": [
                    {"input": " ", "output": "true"},
                    {"input": "0P", "output": "false"},
                    {"input": "Madam", "output": "true"}
                ]
            },
            {
                "title": "Missing Number in Array",
                "slug": "missing-number-in-array",
                "difficulty": "EASY",
                "algorithm": None,
                "description": "Given an array `nums` containing `N` distinct numbers in the range `[0, N]`, return the only number in the range that is missing from the array.",
                "input_format": "First line: N\nSecond line: N space-separated integers",
                "output_format": "Print the missing number.",
                "constraints": "1 <= N <= 10^4\n0 <= nums[i] <= N",
                "sample_test_cases": [
                    {"input": "3\n3 0 1", "output": "2", "explanation": "Range is 0..3, missing is 2."},
                    {"input": "2\n0 1", "output": "2", "explanation": "Range is 0..2, missing is 2."}
                ],
                "hidden_test_cases": [
                    {"input": "9\n9 6 4 2 3 5 7 0 1", "output": "8"},
                    {"input": "1\n0", "output": "1"}
                ]
            },
            {
                "title": "Two Sum Target",
                "slug": "two-sum-target",
                "difficulty": "EASY",
                "algorithm": None,
                "description": "Given an array of integers `nums` and an integer `target`, return the 0-indexed indices of the two numbers such that they add up to `target`. Output indices in ascending order separated by space.",
                "input_format": "First line: N target\nSecond line: N space-separated integers",
                "output_format": "Print two space-separated indices.",
                "constraints": "2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9",
                "sample_test_cases": [
                    {"input": "4 9\n2 7 11 15", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9."},
                    {"input": "3 6\n3 2 4", "output": "1 2", "explanation": "nums[1] + nums[2] = 2 + 4 = 6."}
                ],
                "hidden_test_cases": [
                    {"input": "2 6\n3 3", "output": "0 1"},
                    {"input": "5 10\n1 2 3 4 6", "output": "3 4"}
                ]
            }
        ]

        for p_data in problems_data:
            prob, _ = Problem.objects.update_or_create(
                slug=p_data["slug"],
                defaults={
                    "title": p_data["title"],
                    "difficulty": p_data["difficulty"],
                    "algorithm": p_data["algorithm"],
                    "description": p_data["description"],
                    "input_format": p_data["input_format"],
                    "output_format": p_data["output_format"],
                    "constraints": p_data["constraints"],
                    "sample_test_cases": p_data["sample_test_cases"],
                    "hidden_test_cases": p_data["hidden_test_cases"],
                    "is_active": True
                }
            )
            algo_name = prob.algorithm.name if prob.algorithm else "General Bank"
            self.stdout.write(f"Problem ready: {prob.title} [{prob.difficulty}] ({algo_name})")

        # 4. Create 40 Demo Participants
        self.stdout.write("Creating 40 demo participants...")
        colleges = [
            "MIT Campus, Anna University", "CEG Anna University", "PSG Tech",
            "SSN College of Engineering", "Vellore Institute of Technology",
            "NIT Trichy", "IIT Madras", "BITS Pilani"
        ]
        departments = ["Computer Science", "Information Technology", "AI & Data Science", "ECE"]

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
                    "phone": f"+91 9876543{i:03d}",
                    "college": colleges[i % len(colleges)],
                    "department": departments[i % len(departments)],
                    "year_of_study": f"Year {(i % 4) + 1}",
                    "balance": 1000,
                    "is_active_participant": True
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded BIT2CODE demo data! (40 participants, 8 algorithms, 12 problems, admin)"))
