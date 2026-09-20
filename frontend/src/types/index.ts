export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

export interface Participant {
  id: number;
  username: string;
  anonymous_label: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year_of_study: string;
  github_profile?: string;
  linkedin_profile?: string;
  balance: number;
  algorithm_assigned: number | null;
  algorithm_assigned_name: string | null;
  coding_started_at: string | null;
  coding_deadline: string | null;
  remaining_coding_seconds: number;
  has_algorithm: boolean;
  is_coding: boolean;
  is_coding_finished: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface Algorithm {
  id: number;
  name: string;
  slug: string;
  description: string;
  difficulty: string;
  total_slots: number;
  assigned_slots: number;
  remaining_slots: number;
  order: number;
  is_active: boolean;
}

export interface BidItem {
  id: number;
  participant_label: string;
  amount: number;
  created_at: string;
}

export interface Auction {
  id: number;
  algorithm: number;
  algorithm_details: Algorithm;
  cycle_number: number;
  duration_seconds: number;
  start_time: string | null;
  end_time: string | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  current_highest_bid: number;
  winning_bid: number | null;
  winning_participant: number | null;
  winning_participant_label: string | null;
  recent_bids: BidItem[];
  remaining_seconds: number;
  is_expired: boolean;
  created_at: string;
}

export interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  algorithm: number | null;
  algorithm_name: string | null;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  time_limit: number;
  memory_limit: number;
  sample_test_cases: TestCase[];
  order: number;
}

export interface Submission {
  id: number;
  participant: number;
  participant_label: string;
  problem: number;
  problem_title: string;
  problem_difficulty: string;
  language: 'python' | 'cpp' | 'java';
  source_code: string;
  submitted_at: string;
  status: 'QUEUED' | 'RUNNING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'MEMORY_LIMIT_EXCEEDED' | 'SERVER_ERROR';
  score: number;
  passed_test_cases: number;
  total_test_cases: number;
  execution_time: number;
  memory_used: number;
  compile_output: string;
  stderr: string;
  stdout: string;
}

export interface LeaderboardEntry {
  rank: number;
  participant_label: string;
  participant_name: string;
  college: string;
  algorithm_name: string | null;
  medium_score: number;
  easy_score: number;
  total_score: number;
  total_execution_time: number;
  last_accepted_submission_at: string | null;
}

export interface AdminOverview {
  total_participants: number;
  assigned_participants: number;
  waiting_participants: number;
  coding_participants: number;
  total_submissions: number;
  current_auction: Auction | null;
}
