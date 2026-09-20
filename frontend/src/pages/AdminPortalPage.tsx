import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminOverview, Algorithm, Participant, Submission } from '../types';
import { 
  ShieldAlert, 
  Play, 
  Square, 
  Shuffle, 
  Users, 
  FileCode2, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Timer } from '../components/Timer';
import { VerdictBadge } from '../components/VerdictBadge';

export const AdminPortalPage: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAlgoId, setSelectedAlgoId] = useState<number | undefined>(undefined);
  const [durationSecs, setDurationSecs] = useState<number>(45);

  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [ov, algos, parts, subs] = await Promise.all([
        api.getAdminOverview(),
        api.getAlgorithms(),
        api.getAdminParticipants(),
        api.getAdminSubmissions()
      ]);
      setOverview(ov);
      setAlgorithms(algos);
      setParticipants(parts);
      setSubmissions(subs);
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
                value={selectedAlgoId}
                onChange={(e) => setSelectedAlgoId(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {algorithms.map(algo => (
                  <option key={algo.id} value={algo.id}>
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
              <button
                onClick={handleStartAuction}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Start 45s Cycle</span>
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

        {/* Participants Table */}
        <div className="glass-panel rounded-3xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Participants Directory ({participants.length})</span>
          </h3>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Assigned Algorithm</th>
                  <th className="px-4 py-3">Timer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{p.anonymous_label}</td>
                    <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400">{p.college}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{p.balance} pts</td>
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
                        <span className="text-pink-400 font-mono font-bold">
                          Coding ({Math.floor(p.remaining_coding_seconds / 60)}m left)
                        </span>
                      ) : p.is_coding_finished ? (
                        <span className="text-gray-500">Finished</span>
                      ) : (
                        <span className="text-gray-400">Not Started</span>
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
    </div>
  );
};
