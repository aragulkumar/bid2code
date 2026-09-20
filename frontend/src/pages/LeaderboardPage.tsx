import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Search, Clock, Award, ShieldCheck, Flame } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
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
              Ranked by Total Score (Max 200 pts) • Tie-breakers: Total Execution Time & Earlier Accepted Submissions
            </p>
          </div>

          {/* Search bar */}
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

        {/* Top 3 Podium Cards */}
        {!isLoading && entries.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 glass-panel rounded-3xl p-6 border border-gray-700/60 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gray-400/10 border border-gray-400/30 text-gray-300 flex items-center justify-center mx-auto mb-3 font-black text-lg">
                #2
              </div>
              <div className="font-mono font-bold text-xs text-indigo-400">{entries[1].participant_label}</div>
              <h3 className="font-bold text-lg text-white mt-0.5">{entries[1].participant_name}</h3>
              <p className="text-xs text-gray-400 truncate mt-1">{entries[1].college}</p>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Score</div>
                  <div className="text-lg font-black text-white">{entries[1].total_score} / 200</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Time</div>
                  <div className="text-sm font-mono text-gray-300">{entries[1].total_execution_time}s</div>
                </div>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="order-1 md:order-2 glass-panel rounded-3xl p-6 border border-amber-500/40 text-center relative overflow-hidden glow-amber -translate-y-2">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto mb-3 font-black text-xl shadow-lg shadow-amber-500/30">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="font-mono font-bold text-xs text-amber-400">{entries[0].participant_label}</div>
              <h3 className="font-black text-xl text-white mt-0.5">{entries[0].participant_name}</h3>
              <p className="text-xs text-gray-400 truncate mt-1">{entries[0].college}</p>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Score</div>
                  <div className="text-2xl font-black text-amber-400">{entries[0].total_score} / 200</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Time</div>
                  <div className="text-sm font-mono text-gray-300">{entries[0].total_execution_time}s</div>
                </div>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 md:order-3 glass-panel rounded-3xl p-6 border border-amber-800/40 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-800/20 border border-amber-700/30 text-amber-500 flex items-center justify-center mx-auto mb-3 font-black text-lg">
                #3
              </div>
              <div className="font-mono font-bold text-xs text-indigo-400">{entries[2].participant_label}</div>
              <h3 className="font-bold text-lg text-white mt-0.5">{entries[2].participant_name}</h3>
              <p className="text-xs text-gray-400 truncate mt-1">{entries[2].college}</p>
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-around">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Score</div>
                  <div className="text-lg font-black text-white">{entries[2].total_score} / 200</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Time</div>
                  <div className="text-sm font-mono text-gray-300">{entries[2].total_execution_time}s</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/90 text-gray-400 text-[11px] uppercase font-mono tracking-wider border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Participant</th>
                  <th className="px-6 py-4">Assigned Algorithm</th>
                  <th className="px-6 py-4 text-center">Medium Score</th>
                  <th className="px-6 py-4 text-center">Easy Score</th>
                  <th className="px-6 py-4 text-right">Total Score</th>
                  <th className="px-6 py-4 text-right">Exec Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading leaderboard standings...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No participants matching query.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((row) => (
                    <tr
                      key={row.participant_label}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                          row.rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : row.rank === 2
                            ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40'
                            : row.rank === 3
                            ? 'bg-amber-800/20 text-amber-500 border border-amber-700/40'
                            : 'text-gray-400'
                        }`}>
                          {row.rank}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                            {row.participant_label}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm">{row.participant_name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">{row.college}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-300 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                          {row.algorithm_name || 'Pending'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          {row.medium_score} / 100
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                          {row.easy_score} / 100
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-base font-mono font-black text-white">
                          {row.total_score}
                        </span>
                        <span className="text-xs text-gray-500 font-mono ml-1">/ 200</span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap text-xs font-mono text-gray-400">
                        {row.total_execution_time}s
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
