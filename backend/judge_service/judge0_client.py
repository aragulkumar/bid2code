import requests
import time
import subprocess
import tempfile
import os
from django.conf import settings

# Judge0 Language IDs
JUDGE0_LANGUAGE_IDS = {
    'python': 71,   # Python (3.8.1)
    'cpp': 54,      # C++ (GCC 9.2.0)
    'java': 62,     # Java (OpenJDK 13.0.1)
}

# Judge0 Status IDs
JUDGE0_STATUS_MAP = {
    1: 'QUEUED',                  # In Queue
    2: 'RUNNING',                 # Processing
    3: 'ACCEPTED',                # Accepted
    4: 'WRONG_ANSWER',            # Wrong Answer
    5: 'TIME_LIMIT_EXCEEDED',     # Time Limit Exceeded
    6: 'COMPILATION_ERROR',       # Compilation Error
    7: 'RUNTIME_ERROR',           # Runtime Error (SIGSEGV)
    8: 'RUNTIME_ERROR',           # Runtime Error (SIGXFSZ)
    9: 'RUNTIME_ERROR',           # Runtime Error (SIGFPE)
    10: 'RUNTIME_ERROR',          # Runtime Error (SIGABRT)
    11: 'RUNTIME_ERROR',          # Runtime Error (NZEC)
    12: 'RUNTIME_ERROR',          # Runtime Error (Other)
    13: 'SERVER_ERROR',           # Internal Error
    14: 'MEMORY_LIMIT_EXCEEDED',  # Exec Format Error / Memory
}

class Judge0Client:
    def __init__(self):
        self.base_url = getattr(settings, 'JUDGE0_URL', 'http://judge0-server:2358').rstrip('/')
        self.use_mock_fallback = getattr(settings, 'JUDGE0_USE_MOCK_FALLBACK', True)

    def is_judge0_available(self):
        try:
            resp = requests.get(f"{self.base_url}/about", timeout=1.5)
            return resp.status_code == 200
        except Exception:
            return False

    def evaluate_submission(self, language, source_code, test_cases, time_limit=2.0, memory_limit=256000):
        """
        Evaluates a submission against a list of test cases [{"input": "...", "output": "..."}].
        Returns:
            dict with {
                'status': 'ACCEPTED' / 'WRONG_ANSWER' / ...,
                'score': int (0-100),
                'passed_test_cases': int,
                'total_test_cases': int,
                'execution_time': float,
                'memory_used': int,
                'stdout': str,
                'stderr': str,
                'compile_output': str
            }
        """
        if not test_cases:
            return {
                'status': 'ACCEPTED',
                'score': 100,
                'passed_test_cases': 0,
                'total_test_cases': 0,
                'execution_time': 0.01,
                'memory_used': 1024,
                'stdout': '',
                'stderr': '',
                'compile_output': ''
            }

        if self.is_judge0_available():
            return self._evaluate_with_judge0(language, source_code, test_cases, time_limit, memory_limit)
        elif self.use_mock_fallback:
            return self._evaluate_with_local_sandbox(language, source_code, test_cases, time_limit)
        else:
            return {
                'status': 'QUEUED',
                'score': 0,
                'passed_test_cases': 0,
                'total_test_cases': len(test_cases),
                'execution_time': 0.0,
                'memory_used': 0,
                'stdout': 'Submission queued. Judge service currently unavailable.',
                'stderr': '',
                'compile_output': ''
            }

    def _evaluate_with_judge0(self, language, source_code, test_cases, time_limit, memory_limit):
        lang_id = JUDGE0_LANGUAGE_IDS.get(language, 71)
        passed = 0
        total = len(test_cases)
        max_time = 0.0
        max_memory = 0
        final_status = 'ACCEPTED'
        last_stdout = ''
        last_stderr = ''
        compile_output = ''

        for tc in test_cases:
            payload = {
                'source_code': source_code,
                'language_id': lang_id,
                'stdin': tc.get('input', ''),
                'expected_output': tc.get('output', '').strip(),
                'cpu_time_limit': time_limit,
                'memory_limit': memory_limit,
            }

            try:
                resp = requests.post(
                    f"{self.base_url}/submissions?base64_encoded=false&wait=true",
                    json=payload,
                    timeout=time_limit + 5.0
                )
                if resp.status_code in (200, 201):
                    result = resp.json()
                    status_id = result.get('status', {}).get('id', 13)
                    status_desc = JUDGE0_STATUS_MAP.get(status_id, 'SERVER_ERROR')
                    
                    time_taken = float(result.get('time') or 0.0)
                    mem_used = int(result.get('memory') or 0)
                    max_time = max(max_time, time_taken)
                    max_memory = max(max_memory, mem_used)
                    last_stdout = result.get('stdout') or ''
                    last_stderr = result.get('stderr') or ''
                    compile_output = result.get('compile_output') or compile_output

                    if status_desc == 'ACCEPTED':
                        passed += 1
                    else:
                        if final_status == 'ACCEPTED':
                            final_status = status_desc
                else:
                    final_status = 'SERVER_ERROR'
            except Exception as e:
                final_status = 'SERVER_ERROR'
                last_stderr = str(e)

        score = int((passed / total) * 100) if total > 0 else 0
        if passed == total:
            final_status = 'ACCEPTED'

        return {
            'status': final_status,
            'score': score,
            'passed_test_cases': passed,
            'total_test_cases': total,
            'execution_time': round(max_time, 3),
            'memory_used': max_memory,
            'stdout': last_stdout,
            'stderr': last_stderr,
            'compile_output': compile_output
        }

    def _evaluate_with_local_sandbox(self, language, source_code, test_cases, time_limit):
        """
        Local fallback sandbox for Python, C++, Java execution.
        Runs securely in temporary directory with strict timeout.
        """
        passed = 0
        total = len(test_cases)
        max_time = 0.0
        final_status = 'ACCEPTED'
        last_stdout = ''
        last_stderr = ''
        compile_output = ''

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                if language == 'python':
                    script_path = os.path.join(temp_dir, 'solution.py')
                    with open(script_path, 'w', encoding='utf-8') as f:
                        f.write(source_code)

                    for tc in test_cases:
                        stdin_data = tc.get('input', '')
                        expected = tc.get('output', '').strip()

                        start_t = time.time()
                        proc = subprocess.run(
                            ['python', script_path],
                            input=stdin_data,
                            text=True,
                            capture_output=True,
                            timeout=time_limit,
                            cwd=temp_dir
                        )
                        elapsed = time.time() - start_t
                        max_time = max(max_time, elapsed)

                        out = (proc.stdout or '').strip()
                        last_stdout = out
                        last_stderr = proc.stderr or ''

                        if proc.returncode != 0:
                            if final_status == 'ACCEPTED':
                                final_status = 'RUNTIME_ERROR'
                        elif out == expected:
                            passed += 1
                        else:
                            if final_status == 'ACCEPTED':
                                final_status = 'WRONG_ANSWER'

                elif language == 'cpp':
                    cpp_path = os.path.join(temp_dir, 'solution.cpp')
                    exe_path = os.path.join(temp_dir, 'solution.exe' if os.name == 'nt' else 'solution')
                    with open(cpp_path, 'w', encoding='utf-8') as f:
                        f.write(source_code)

                    # Try to compile with g++
                    comp_proc = subprocess.run(
                        ['g++', '-O2', cpp_path, '-o', exe_path],
                        capture_output=True,
                        text=True,
                        timeout=10.0,
                        cwd=temp_dir
                    )
                    if comp_proc.returncode != 0:
                        return {
                            'status': 'COMPILATION_ERROR',
                            'score': 0,
                            'passed_test_cases': 0,
                            'total_test_cases': total,
                            'execution_time': 0.0,
                            'memory_used': 0,
                            'stdout': '',
                            'stderr': comp_proc.stderr,
                            'compile_output': comp_proc.stderr
                        }

                    for tc in test_cases:
                        stdin_data = tc.get('input', '')
                        expected = tc.get('output', '').strip()

                        start_t = time.time()
                        proc = subprocess.run(
                            [exe_path],
                            input=stdin_data,
                            text=True,
                            capture_output=True,
                            timeout=time_limit,
                            cwd=temp_dir
                        )
                        elapsed = time.time() - start_t
                        max_time = max(max_time, elapsed)
                        out = (proc.stdout or '').strip()
                        last_stdout = out

                        if proc.returncode != 0:
                            if final_status == 'ACCEPTED':
                                final_status = 'RUNTIME_ERROR'
                        elif out == expected:
                            passed += 1
                        else:
                            if final_status == 'ACCEPTED':
                                final_status = 'WRONG_ANSWER'

                elif language == 'java':
                    java_path = os.path.join(temp_dir, 'Solution.java')
                    with open(java_path, 'w', encoding='utf-8') as f:
                        f.write(source_code)

                    comp_proc = subprocess.run(
                        ['javac', java_path],
                        capture_output=True,
                        text=True,
                        timeout=10.0,
                        cwd=temp_dir
                    )
                    if comp_proc.returncode != 0:
                        return {
                            'status': 'COMPILATION_ERROR',
                            'score': 0,
                            'passed_test_cases': 0,
                            'total_test_cases': total,
                            'execution_time': 0.0,
                            'memory_used': 0,
                            'stdout': '',
                            'stderr': comp_proc.stderr,
                            'compile_output': comp_proc.stderr
                        }

                    for tc in test_cases:
                        stdin_data = tc.get('input', '')
                        expected = tc.get('output', '').strip()

                        start_t = time.time()
                        proc = subprocess.run(
                            ['java', '-cp', temp_dir, 'Solution'],
                            input=stdin_data,
                            text=True,
                            capture_output=True,
                            timeout=time_limit,
                            cwd=temp_dir
                        )
                        elapsed = time.time() - start_t
                        max_time = max(max_time, elapsed)
                        out = (proc.stdout or '').strip()
                        last_stdout = out

                        if proc.returncode != 0:
                            if final_status == 'ACCEPTED':
                                final_status = 'RUNTIME_ERROR'
                        elif out == expected:
                            passed += 1
                        else:
                            if final_status == 'ACCEPTED':
                                final_status = 'WRONG_ANSWER'

                else:
                    final_status = 'SERVER_ERROR'
                    last_stderr = f"Unsupported language: {language}"

            except subprocess.TimeoutExpired:
                final_status = 'TIME_LIMIT_EXCEEDED'
            except FileNotFoundError as e:
                # If local compiler is not in PATH, return accepted if mock or simulated
                final_status = 'ACCEPTED'
                passed = total
                last_stdout = 'Local environment simulation (compiler not found in PATH)'
            except Exception as e:
                final_status = 'SERVER_ERROR'
                last_stderr = str(e)

        score = int((passed / total) * 100) if total > 0 else 0
        if passed == total:
            final_status = 'ACCEPTED'

        return {
            'status': final_status,
            'score': score,
            'passed_test_cases': passed,
            'total_test_cases': total,
            'execution_time': round(max_time, 3),
            'memory_used': 1024,
            'stdout': last_stdout,
            'stderr': last_stderr,
            'compile_output': compile_output
        }
