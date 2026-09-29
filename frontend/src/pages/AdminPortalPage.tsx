import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { getAllFirebaseParticipants } from '../services/firebase';
import { AdminOverview, Algorithm, Submission } from '../types';
import { 
  ShieldAlert, 
  Play, 
  Square, 
  Shuffle, 
  Users, 
  FileCode2, 
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Mail,
  GraduationCap,
  Zap,
  ZapOff,
  Clock,
} from 'lucide-react';
import { Timer } from '../components/Timer';
import { VerdictBadge } from '../components/VerdictBadge';

interface FirebaseParticipant {
  uid: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year_of_study: string;
  username: string;
  anonymous_label: string;
  balance: number;
  algorithm_assigned: string | null;
  algorithm_assigned_name: string | null;
  is_active_participant: boolean;
  is_coding?: boolean;
  is_coding_finished?: boolean;
  created_at: string;
  [key: string]: unknown;
}

export const AdminPortalPage: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [fbParticipants, setFbParticipants] = useState<FirebaseParticipant[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAlgoId, setSelectedAlgoId] = useState<number | undefined>(undefined);
  const [durationSecs, setDurationSecs] = useState<number>(45);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Auto-Pilot state
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [autoPilotCountdown, setAutoPilotCountdown] = useState(0);
  const autoPilotRef = useRef(false);
  const countdownRef = useRef(0);
  const overviewRef = useRef<AdminOverview | null>(null);
  const algorithmsRef = useRef<Algorithm[]>([]);
  const durationRef = useRef(45);

  // Fetch backend data (auction, overview, submissions) + real Firebase participants
  const fetchAdminData = async () => {
    try {
      const [ov, algos, subs, fbParts] = await Promise.all([
        api.getAdminOverview().catch(() => null),
        api.getAlgorithms().catch(() => []),
        api.getAdminSubmissions().catch(() => []),
        getAllFirebaseParticipants(),
      ]);
      if (ov) {
        setOverview(ov);
        overviewRef.current = ov;
      }
      setAlgorithms(algos);
      algorithmsRef.current = algos;
      setSubmissions(subs);
      setFbParticipants(fbParts as FirebaseParticipant[]);
      if (!selectedAlgoId && algos.length > 0) {
        setSelectedAlgoId(algos[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Keep durationRef in sync
  useEffect(() => { durationRef.current = durationSecs; }, [durationSecs]);

  // Auto-Pilot tick — runs every 1 second
  useEffect(() => {
    autoPilotRef.current = isAutoPilot;
    if (!isAutoPilot) {
      countdownRef.current = 0;
      setAutoPilotCountdown(0);
      return;
    }
    // Start with a 3-second grace period
    countdownRef.current = 3;
    setAutoPilotCountdown(3);

    const tick = setInterval(async () => {
      if (!autoPilotRef.current) return;

      const ov = overviewRef.current;
      const algos = algorithmsRef.current;
      const auctionStatus = ov?.current_auction?.status;

      if (auctionStatus === 'ACTIVE') {
        // Auction running — reset post-auction countdown to 5s gap
        countdownRef.current = 5;
        setAutoPilotCountdown(5);
        return;
      }

      // Auction not active — count down before starting next
      if (countdownRef.current > 0) {
        countdownRef.current--;
        setAutoPilotCountdown(countdownRef.current);
        return;
      }

      // Check if any algorithms have slots remaining
      const hasRemaining = algos.some(a => a.remaining_slots > 0);
      if (!hasRemaining) {
        autoPilotRef.current = false;
        setIsAutoPilot(false);
        setActionMsg('✅ Auto-Pilot complete! All algorithms auctioned. Run "Random Assign Remaining" now.');
        return;
      }

      // Start next auction — backend picks next available algorithm by order
      try {
        const res = await api.startAuction(undefined, durationRef.current);
        setActionMsg(`🤖 AUTO: ${res.message}`);
        // Reset countdown: duration + 5s gap
        countdownRef.current = durationRef.current + 5;
        setAutoPilotCountdown(durationRef.current + 5);
        await fetchAdminData();
      } catch (e: any) {
        setActionMsg(`Auto-pilot error: ${e.message}`);
        autoPilotRef.current = false;
        setIsAutoPilot(false);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [isAutoPilot]);

  const toggleAutoPilot = useCallback(() => {
    setIsAutoPilot(prev => !prev);
    setActionMsg(null);
  }, []);

  const handleStartAuction = async () => {
    setIsProcessing(true);
    setActionMsg(null);
    try {
      const res = await api.startAuction(selectedAlgoId, durationSecs);
      setActionMsg(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(err.message || 'Failed to start auction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAuction = async () => {
    setIsProcessing(true);
    setActionMsg(null);
    try {
      const res = await api.closeAuction();
      setActionMsg(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(err.message || 'Failed to close auction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRandomAssign = async () => {
    setIsProcessing(true);
    setActionMsg(null);
    try {
      const res = await api.randomAssignRemaining();
      setActionMsg(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(err.message || 'Failed to assign remaining algorithms.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetEvent = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
    setIsProcessing(true);
    setActionMsg(null);
    setShowResetConfirm(false);
    setResetConfirmText('');
    try {
      const res = await api.resetEvent();
      setActionMsg(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg(err.message || 'Failed to reset event.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Event Commander</span>
            </div>
            <h1 className="text-3xl font-black text-white">Organizer Control Portal</h1>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>

        {actionMsg && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Live Metrics Grid */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-gray-800">
              <div className="text-xs text-gray-400 uppercase font-mono">Total Coders</div>
              <div className="text-2xl font-black text-white mt-1">{overview.total_participants} / 40</div>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20">
              <div className="text-xs text-emerald-400 uppercase font-mono">Assigned</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{overview.assigned_participants}</div>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
              <div className="text-xs text-amber-400 uppercase font-mono">Waiting</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{overview.waiting_participants}</div>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-pink-500/20">
              <div className="text-xs text-pink-400 uppercase font-mono">In Coding Round</div>
              <div className="text-2xl font-black text-pink-400 mt-1">{overview.coding_participants}</div>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-indigo-500/20 col-span-2 sm:col-span-1">
              <div className="text-xs text-indigo-400 uppercase font-mono">Submissions</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{overview.total_submissions}</div>
            </div>
          </div>
        )}

        {/* Auction Command Center */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/20 glow-brand">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Live Auction Command Panel</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">
                Select Algorithm to Auction
              </label>
              <select
                value={selectedAlgoId ?? ''}
                onChange={(e) => setSelectedAlgoId(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {algorithms.map(algo => (
                  <option key={algo.id} value={String(algo.id)}>
                    {algo.name} ({algo.remaining_slots} slots remaining)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">
                Cycle Duration (Seconds)
              </label>
              <input
                type="number"
                value={durationSecs}
                onChange={(e) => setDurationSecs(parseInt(e.target.value) || 45)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Auto-Pilot Toggle */}
              <button
                onClick={toggleAutoPilot}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 shadow-lg ${
                  isAutoPilot
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isAutoPilot ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{isAutoPilot ? 'Stop Auto-Pilot' : '⚡ Auto-Pilot ALL'}</span>
              </button>

              {/* Countdown badge when auto-pilot is on */}
              {isAutoPilot && autoPilotCountdown > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next in {autoPilotCountdown}s</span>
                </div>
              )}

              <div className="w-px h-6 bg-gray-700" />

              <button
                onClick={handleStartAuction}
                disabled={isProcessing || isAutoPilot}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Manual Start</span>
              </button>

              <button
                onClick={handleCloseAuction}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                <span>Close Auction</span>
              </button>

              <button
                onClick={handleRandomAssign}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>Random Assign Remaining</span>
              </button>

              {/* Reset Event — Danger Zone */}
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-transparent border-2 border-rose-700 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Event</span>
              </button>
            </div>
          </div>

          {/* Current Active Auction Info */}
          {overview?.current_auction && (
            <div className="mt-6 p-4 rounded-2xl bg-gray-900/80 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-400 font-mono font-bold uppercase">Active Cycle:</span>
                <span className="text-base font-bold text-white ml-2">
                  {overview.current_auction.algorithm_details?.name}
                </span>
                <span className="text-xs text-amber-400 ml-4 font-mono">
                  Highest Bid: {overview.current_auction.current_highest_bid} pts
                </span>
              </div>
              <Timer initialSeconds={overview.current_auction.remaining_seconds} size="sm" />
            </div>
          )}
        </div>

        {/* Participants Directory — Real Firebase Registrations */}
        <div className="glass-panel rounded-3xl p-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Registered Participants ({fbParticipants.length})</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 ml-1">
                Live from Firebase
              </span>
            </h3>
            {/* Search */}
            <input
              type="text"
              placeholder="Search name, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-full sm:w-56 transition-colors"
            />
          </div>

          {fbParticipants.length === 0 && !isLoading && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No participants registered yet.
            </div>
          )}

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Algorithm</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {fbParticipants
                  .filter(p => {
                    const q = searchQuery.toLowerCase();
                    return !q ||
                      (p.name || '').toLowerCase().includes(q) ||
                      (p.email || '').toLowerCase().includes(q) ||
                      (p.username || '').toLowerCase().includes(q) ||
                      (p.anonymous_label || '').toLowerCase().includes(q) ||
                      (p.college || '').toLowerCase().includes(q);
                  })
                  .map((p, idx) => (
                    <tr key={p.uid || idx} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-400">
                        {p.anonymous_label || `P${String(idx + 1).padStart(2, '0')}`}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{p.username}</td>
                      <td className="px-4 py-3 text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        {p.email}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 shrink-0" />
                          {p.college || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{p.year_of_study || '—'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">{p.balance ?? 1000} pts</td>
                      <td className="px-4 py-3">
                        {p.algorithm_assigned_name ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                            {p.algorithm_assigned_name}
                          </span>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.is_coding ? (
                          <span className="text-pink-400 font-mono font-bold">Coding</span>
                        ) : p.is_coding_finished ? (
                          <span className="text-gray-500">Finished</span>
                        ) : (
                          <span className="text-emerald-400">Registered</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Live Submissions Stream */}
        <div className="glass-panel rounded-3xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-purple-400" />
            <span>Latest Submissions Stream ({submissions.length})</span>
          </h3>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Problem</th>
                  <th className="px-4 py-3">Lang</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Exec Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500 font-mono">
                      {new Date(s.submitted_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{s.participant_label}</td>
                    <td className="px-4 py-3 font-bold text-white">{s.problem_title}</td>
                    <td className="px-4 py-3 font-mono uppercase text-gray-400">{s.language}</td>
                    <td className="px-4 py-3">
                      <VerdictBadge status={s.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{s.score} / 100</td>
                    <td className="px-4 py-3 font-mono text-gray-400">{s.execution_time}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F1420] border-2 border-rose-600/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-rose-900/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Reset Entire Event</h2>
                <p className="text-xs text-rose-400 font-mono">This action is irreversible!</p>
              </div>
            </div>

            <div className="text-sm text-gray-300 space-y-2 mb-6">
              <p>The following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs">
                <li>All auctions and bids</li>
                <li>All algorithm assignments</li>
                <li>All coding sessions and timers</li>
                <li>All submissions and scores</li>
              </ul>
              <p className="mt-3 text-gray-400">Participant accounts and registrations will <strong className="text-white">NOT</strong> be deleted. Balances will be restored to <strong className="text-amber-400">1000 pts</strong>.</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-mono uppercase text-rose-400 mb-1.5">
                Type <strong>RESET</strong> to confirm
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-rose-700/50 text-white font-mono font-bold text-lg focus:outline-none focus:border-rose-500 placeholder-gray-600 tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetEvent}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Event Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
