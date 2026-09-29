import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LeaderboardEntry } from '../types';
import { Trophy, Search, Clock, Zap } from 'lucide-react';

const ScoreDisplay = ({
  total, coding, bonus, size = 'md'
}: {
  total: number; coding: number; bonus: number; size?: 'sm' | 'md' | 'lg'
}) => {
  const totalClass = size === 'lg'
    ? 'text-2xl font-black text-amber-400'
    : size === 'md'
    ? 'text-xl font-black text-amber-400'
    : 'text-lg font-black text-white';

  return (
    <div className="flex flex-col items-center">
      <div className={totalClass}>
        {total}
        <span className={`font-normal ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-500 ml-1`}>/ 210</span>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[10px] text-gray-400 font-mono">
          Code: <span className="text-emerald-400 font-bold">{coding}</span>
        </span>
        {bonus > 0 && (
          <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
            +{bonus} bid
          </span>
        )}
      </div>
    </div>
  );
};

const CodingTimeDisplay = ({ timeDisplay }: { timeDisplay: string | null | undefined }) => {
  if (!timeDisplay) {
    return <span className="text-gray-600 text-xs font-mono">-</span>;
  }
  return (
    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
      {timeDisplay}
    </span>
  );
};

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredEntries = entries.filter(e =>
    e.participant_label.toLowerCase().includes(search.toLowerCase()) ||
    e.participant_name.toLowerCase().includes(search.toLowerCase()) ||
    e.college.toLowerCase().includes(search.toLowerCase()) ||
    (e.algorithm_name && e.algorithm_name.toLowerCase().includes(search.toLowerCase()))
  );

  const PodiumCard = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
    const isCurrentUser = user && (user.anonymous_label === entry.participant_label || user.name === entry.participant_name);
    const isGold = rank === 1;
    const isSilver = rank === 2;

    const borderClass = isGold
      ? 'border-amber-500/50 glow-amber'
      : isSilver
      ? 'border-gray-500/40'
      : 'border-amber-800/40';

    const rankBadgeClass = isGold
      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/30'
      : isSilver
      ? 'bg-gray-400/10 border-gray-400/30 text-gray-300'
      : 'bg-amber-800/20 border-amber-700/30 text-amber-500';

    return (
      <div className={`glass-panel rounded-3xl p-6 border ${borderClass} text-center relative overflow-hidden ${isGold ? '-translate-y-2' : ''}`}>
        {isGold && <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />}
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 font-black text-lg ${rankBadgeClass}`}>
          {isGold ? <Trophy className="w-6 h-6" /> : `#${rank}`}
        </div>
        <div className="font-mono font-bold text-xs text-indigo-400">{entry.participant_label}</div>
        <h3 className={`font-black ${isGold ? 'text-xl' : 'text-lg'} text-white mt-0.5 flex items-center justify-center gap-2`}>
          {entry.participant_name}
          {isCurrentUser && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">You</span>
          )}
        </h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">{entry.college}</p>
        <div className="mt-4 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Score</div>
            <ScoreDisplay total={entry.total_score} coding={entry.coding_score} bonus={entry.bid_bonus} size={isGold ? 'md' : 'sm'} />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Coding Time</div>
            {(entry.coding_time_display || entry.total_time_taken) ? (
              <div>
                <span className="text-gray-100 text-sm font-mono font-bold">{entry.coding_time_display || entry.total_time_taken}</span>
                <span className="block text-[9px] text-gray-500 font-mono">total time taken</span>
              </div>
            ) : (
              <span className="text-gray-600 text-xs font-mono">-</span>
            )}
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Topic</div>
            <div className="text-xs font-semibold text-indigo-300 truncate">{entry.algorithm_name || 'Pending'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Official Standings</span>
            </div>
            <h1 className="text-3xl font-black text-white">Live Leaderboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Max 210 pts (Code: 200 + Bid Bonus: up to 10) &bull; Ranked: Score &rarr; Coding Time (Total Time Taken for 2 Problems) &rarr; Fewer Attempts &rarr; Earliest Finish
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search participant or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Podium */}
        {!isLoading && entries.length > 0 && (
          <div className="pt-2">
            {entries.length === 1 ? (
              <div className="max-w-sm mx-auto"><PodiumCard entry={entries[0]} rank={1} /></div>
            ) : entries.length === 2 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <PodiumCard entry={entries[0]} rank={1} />
                <PodiumCard entry={entries[1]} rank={2} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="order-2 md:order-1"><PodiumCard entry={entries[1]} rank={2} /></div>
                <div className="order-1 md:order-2"><PodiumCard entry={entries[0]} rank={1} /></div>
                <div className="order-3 md:order-3"><PodiumCard entry={entries[2]} rank={3} /></div>
              </div>
            )}
          </div>
        )}

        {/* Full Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/90 text-gray-400 text-[11px] uppercase font-mono tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Participant</th>
                  <th className="px-5 py-4">Algorithm</th>
                  <th className="px-5 py-4 text-center">Medium</th>
                  <th className="px-5 py-4 text-center">Easy</th>
                  <th className="px-5 py-4 text-center">Coding</th>
                  <th className="px-5 py-4 text-center">Bonus</th>
                  <th className="px-5 py-4 text-right">Total</th>
                  <th className="px-5 py-4 text-center">Attempts</th>
                  <th className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 inline text-indigo-400" />
                      <span>Coding Time</span>
                    </div>
                    <span className="block text-[9px] text-gray-400 font-normal normal-case tracking-normal">Total time taken</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">Loading leaderboard standings...</td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">No participants matching query.</td>
                  </tr>
                ) : (
                  filteredEntries.map((row) => {
                    const isCurrentUser = user && (user.anonymous_label === row.participant_label || user.name === row.participant_name);
                    return (
                      <tr
                        key={row.participant_label}
                        className={`transition-colors ${isCurrentUser ? 'bg-indigo-950/40 border-l-4 border-indigo-500 hover:bg-indigo-900/40' : 'hover:bg-gray-800/40'}`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                            row.rank === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : row.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40'
                            : row.rank === 3 ? 'bg-amber-800/20 text-amber-500 border border-amber-700/40'
                            : 'text-gray-400'
                          }`}>
                            {row.rank}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                              {row.participant_label}
                            </span>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{row.participant_name}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">You</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-[180px]">{row.college}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-300 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                            {row.algorithm_name || 'Pending'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded border ${row.medium_score > 0 ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-gray-600 bg-gray-900/50 border-gray-800'}`}>
                            {row.medium_score} / 100
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded border ${row.easy_score > 0 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-gray-600 bg-gray-900/50 border-gray-800'}`}>
                            {row.easy_score} / 100
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <span className={`font-mono text-sm font-black ${row.coding_score > 0 ? 'text-white' : 'text-gray-600'}`}>
                            {row.coding_score}
                          </span>
                          <span className="text-xs text-gray-600 font-mono ml-0.5">/ 200</span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {row.bid_bonus > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                              <Zap className="w-3 h-3" />+{row.bid_bonus}
                            </span>
                          ) : (
                            <span className="text-gray-700 text-xs">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className="text-base font-mono font-black text-white">{row.total_score}</span>
                          <span className="text-xs text-gray-500 font-mono ml-1">/ 210</span>
                        </td>

                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          {row.submission_count > 0 ? (
                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
                              row.submission_count <= 2 ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                              : row.submission_count <= 5 ? 'text-gray-300 bg-gray-700/40 border-gray-700'
                              : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                            }`}>{row.submission_count}</span>
                          ) : (
                            <span className="text-gray-700 text-xs">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <CodingTimeDisplay timeDisplay={row.coding_time || row.coding_time_display || row.total_time_taken} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

