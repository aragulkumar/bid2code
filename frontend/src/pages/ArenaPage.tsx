import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Problem, Submission } from '../types';
import { Timer } from '../components/Timer';
import { VerdictBadge } from '../components/VerdictBadge';
import { 
  Play, 
  Send, 
  Terminal, 
  FileCode2, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  History, 
  Layers, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

const STARTER_CODE: Record<string, string> = {
  python: `# Python 3 Solution
import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    # Read input and solve
    pass

if __name__ == '__main__':
    solve()
`,
  cpp: `// C++ (GCC) Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Read input and solve
    
    return 0;
}
`,
  java: `// Java (OpenJDK) Solution
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Read input and solve
    }
}
`
};

export const ArenaPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState<number>(0);
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('python');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'output' | 'history'>('output');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customInput, setCustomInput] = useState<string>('');

  const activeProblem = problems[selectedProblemIndex] || null;

  const fetchSessionData = async () => {
    try {
      const data = await api.getAssignedProblems();
      if (data && data.problems) {
        setProblems(data.problems);
      }
      const history = await api.getSubmissionHistory();
      setSubmissionHistory(history);
    } catch (err) {
      console.error('Error fetching coding session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.has_algorithm) {
      navigate('/dashboard');
      return;
    }
    fetchSessionData();
  }, [user]);

  // Key for codeMap: `${problemId}_${language}`
  const currentCodeKey = activeProblem ? `${activeProblem.id}_${language}` : '';
  const currentSourceCode = currentCodeKey ? (codeMap[currentCodeKey] ?? STARTER_CODE[language]) : '';

  const handleCodeChange = (val: string | undefined) => {
    if (!currentCodeKey) return;
    setCodeMap(prev => ({ ...prev, [currentCodeKey]: val || '' }));
  };

  const handleResetCode = () => {
    if (!currentCodeKey) return;
    setCodeMap(prev => ({ ...prev, [currentCodeKey]: STARTER_CODE[language] }));
  };

  const handleCopySample = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunSample = async () => {
    if (!activeProblem || isRunning || user?.is_coding_finished) return;
    setIsRunning(true);
    setActiveTab('output');
    try {
      const res = await api.runSampleCode(
        activeProblem.id,
        language,
        currentSourceCode,
        customInput.trim() ? customInput : undefined
      );
      setRunResult(res);
    } catch (err: any) {
      setRunResult({ verdict: 'SERVER_ERROR', stderr: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem || isSubmitting || user?.is_coding_finished) return;
    setIsSubmitting(true);
    setActiveTab('output');
    try {
      const res = await api.submitCode(activeProblem.id, language, currentSourceCode);
      setRunResult({
        verdict: res.submission.status,
        passed: res.submission.passed_test_cases,
        total: res.submission.total_test_cases,
        score: res.submission.score,
        execution_time: res.submission.execution_time,
        stdout: res.submission.stdout,
        stderr: res.submission.stderr,
        compile_output: res.submission.compile_output
      });
      // Refresh history
      const history = await api.getSubmissionHistory();
      setSubmissionHistory(history);
      await refreshUser();
    } catch (err: any) {
      setRunResult({ verdict: 'SERVER_ERROR', stderr: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Preparing coding arena and problem set...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* Top Sticky Header */}
      <header className="bg-[#111827] border-b border-gray-800 px-4 py-3 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Participant Info & Assigned Algorithm */}
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-300 font-mono text-xs font-bold">
              {user.anonymous_label}
            </span>
            <span className="text-xs font-semibold text-gray-300">
              Algorithm: <span className="text-indigo-400 font-bold">{user.algorithm_assigned_name}</span>
            </span>
          </div>

          {/* Center: Problem Switcher Tabs */}
          <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800">
            {problems.map((prob, idx) => (
              <button
                key={prob.id}
                onClick={() => setSelectedProblemIndex(idx)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedProblemIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Problem {idx + 1}:</span>
                <span className="truncate max-w-[120px]">{prob.title}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  prob.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {prob.difficulty}
                </span>
              </button>
            ))}
          </div>

          {/* Right: Authoritative 40-Minute Countdown Timer */}
          <div className="flex items-center space-x-3">
            <Timer
              initialSeconds={user.remaining_coding_seconds}
              size="sm"
              label="Session Clock"
              onExpire={() => refreshUser()}
            />
          </div>
        </div>
      </header>

      {/* Deadline Notice Banner */}
      {user.is_coding_finished && (
        <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 text-center text-xs font-semibold text-rose-300 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Your 40-minute personal coding timer has expired. Submissions are finalized.</span>
        </div>
      )}

      {/* Main Workspace: 2-Column Split */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (5 Cols): Problem Statement */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-gray-800 flex flex-col h-[calc(100vh-160px)] overflow-y-auto">
          {activeProblem ? (
            <div className="space-y-5">
              {/* Problem Title & Badges */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    activeProblem.difficulty === 'MEDIUM'
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {activeProblem.difficulty}
                  </span>
                  {activeProblem.algorithm_name && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      {activeProblem.algorithm_name}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto font-mono">
                    Time Limit: {activeProblem.time_limit}s
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{activeProblem.title}</h2>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1.5">Problem Statement</h3>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80">
                  {activeProblem.description}
                </div>
              </div>

              {/* Input / Output Format */}
              {activeProblem.input_format && (
                <div>
                  <h3 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1.5">Input Format</h3>
                  <div className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-xl border border-gray-800 font-mono">
                    {activeProblem.input_format}
                  </div>
                </div>
              )}

              {activeProblem.output_format && (
                <div>
                  <h3 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1.5">Output Format</h3>
                  <div className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded-xl border border-gray-800 font-mono">
                    {activeProblem.output_format}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {activeProblem.constraints && (
                <div>
                  <h3 className="text-xs font-mono uppercase text-gray-400 font-bold mb-1.5">Constraints</h3>
                  <div className="text-xs text-gray-400 bg-gray-900/60 p-3 rounded-xl border border-gray-800 font-mono whitespace-pre-line">
                    {activeProblem.constraints}
                  </div>
                </div>
              )}

              {/* Sample Test Cases */}
              {activeProblem.sample_test_cases && activeProblem.sample_test_cases.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase text-gray-400 font-bold">Sample Test Cases</h3>
                  {activeProblem.sample_test_cases.map((stc, idx) => (
                    <div key={idx} className="bg-gray-900/80 rounded-xl p-3 border border-gray-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span className="font-bold text-gray-300">Sample {idx + 1}</span>
                        <button
                          onClick={() => handleCopySample(stc.input, idx)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy Input'}</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase">Input</div>
                          <pre className="bg-black/40 p-2 rounded text-gray-200 overflow-x-auto">{stc.input}</pre>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase">Output</div>
                          <pre className="bg-black/40 p-2 rounded text-emerald-300 overflow-x-auto">{stc.output}</pre>
                        </div>
                      </div>

                      {stc.explanation && (
                        <p className="text-[11px] text-gray-400 italic">
                          Explanation: {stc.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No problem selected.
            </div>
          )}
        </div>

        {/* Right Column (7 Cols): Monaco Editor + Console */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-160px)] gap-3">
          
          {/* Editor Header Bar */}
          <div className="glass-panel rounded-2xl px-4 py-2.5 border border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="python">Python 3 (CPython)</option>
                <option value="cpp">C++ (GCC 9.2)</option>
                <option value="java">Java (OpenJDK 13)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetCode}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-1"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleRunSample}
                disabled={isRunning || isSubmitting || user.is_coding_finished}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isRunning ? 'Testing...' : 'Run Samples'}</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting || user.is_coding_finished}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Evaluating...' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-gray-800 bg-[#1e1e1e] relative min-h-[300px]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'python'}
              value={currentSourceCode}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                tabSize: 4,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: user.is_coding_finished
              }}
            />
          </div>

          {/* Bottom Verdict / Console Drawer */}
          <div className="glass-panel rounded-2xl p-4 border border-gray-800 h-48 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('output')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'output' ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execution Output</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history' ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Submissions History ({submissionHistory.filter(s => s.problem === activeProblem?.id).length})</span>
                </button>
              </div>

              {runResult?.verdict && activeTab === 'output' && (
                <VerdictBadge status={runResult.verdict} score={runResult.score} size="sm" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto text-xs font-mono">
              {activeTab === 'output' ? (
                runResult ? (
                  <div className="space-y-2">
                    {runResult.passed !== undefined && runResult.total !== undefined && (
                      <div className="text-gray-300">
                        Test Cases Passed: <span className="font-bold text-white">{runResult.passed} / {runResult.total}</span>
                        {runResult.execution_time !== undefined && (
                          <span className="text-gray-400 ml-3">Time: {runResult.execution_time}s</span>
                        )}
                      </div>
                    )}
                    {runResult.compile_output && (
                      <div>
                        <div className="text-amber-400 font-bold">Compiler Output:</div>
                        <pre className="bg-black/50 p-2 rounded text-amber-200 whitespace-pre-wrap">{runResult.compile_output}</pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <div className="text-rose-400 font-bold">Runtime Error / Stderr:</div>
                        <pre className="bg-black/50 p-2 rounded text-rose-300 whitespace-pre-wrap">{runResult.stderr}</pre>
                      </div>
                    )}
                    {runResult.stdout && (
                      <div>
                        <div className="text-gray-400">Stdout:</div>
                        <pre className="bg-black/50 p-2 rounded text-gray-200 whitespace-pre-wrap">{runResult.stdout}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 py-4 text-center">
                    Click "Run Samples" or "Submit Solution" to inspect sandboxed execution output.
                  </div>
                )
              ) : (
                /* Submissions History List */
                <div className="space-y-1.5">
                  {submissionHistory
                    .filter(s => s.problem === activeProblem?.id)
                    .map((sub) => (
                      <div key={sub.id} className="p-2 rounded bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <VerdictBadge status={sub.status} score={sub.score} size="sm" />
                          <span className="text-gray-400 uppercase text-[10px]">{sub.language}</span>
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {new Date(sub.submitted_at).toLocaleTimeString()} • {sub.execution_time}s
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
