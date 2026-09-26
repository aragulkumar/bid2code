import React, { useState, useEffect, useCallback } from 'react';
import { getAllFirebaseParticipants } from '../services/firebase';
import {
  ShieldAlert,
  Users,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  GraduationCap,
  Coins,
  Search,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// ── Simple password gate ──────────────────────────────────────────────────────
// Change this password as needed — it's only a frontend gate to keep casual
// visitors out. All real data security is handled by Firestore rules.
const ADMIN_PASSWORD = 'bit2code@admin2026';

interface FirebaseParticipant {
  uid: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year_of_study: string;
  username: string;
  github_profile?: string;
  linkedin_profile?: string;
  anonymous_label: string;
  balance: number;
  algorithm_assigned: string | null;
  algorithm_assigned_name: string | null;
  is_active_participant: boolean;
  created_at: string;
  [key: string]: unknown;
}

// ── CSV export helper ─────────────────────────────────────────────────────────
function exportToCSV(participants: FirebaseParticipant[]) {
  const headers = [
    'Label', 'Full Name', 'Username', 'Email', 'Phone',
    'College', 'Department', 'Year', 'Balance',
    'Algorithm Assigned', 'GitHub', 'LinkedIn', 'Registered At',
  ];

  const rows = participants.map(p => [
    p.anonymous_label,
    p.name,
    p.username,
    p.email,
    p.phone,
    p.college,
    p.department,
    p.year_of_study,
    p.balance,
    p.algorithm_assigned_name || 'Unassigned',
    p.github_profile || '',
    p.linkedin_profile || '',
    p.created_at,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bit2code_participants_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Login Gate Component ──────────────────────────────────────────────────────
const LoginGate: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('b2c_admin', '1');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-rose-600/10 blur-[120px] rounded-full" />
      </div>

      <div className={`relative w-full max-w-sm transition-all ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        <div className="glass-panel rounded-3xl p-8 border border-rose-500/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Admin Access</h1>
            <p className="text-sm text-gray-400 mt-1">BID2CODE Organizer Portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Incorrect password. Try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder="Enter admin password"
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all"
            >
              Access Portal
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-8px)}
          40%,80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
};

// ── Main Firebase Admin Page ──────────────────────────────────────────────────
export const FirebaseAdminPage: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('b2c_admin') === '1');
  const [participants, setParticipants] = useState<FirebaseParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllFirebaseParticipants();
      setParticipants(data as FirebaseParticipant[]);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError('Failed to fetch from Firebase. Check Firestore rules and connectivity.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchParticipants();
  }, [authed, fetchParticipants]);

  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />;

  // Filter participants by search
  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.college?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.anonymous_label?.toLowerCase().includes(q)
    );
  });

  const handleLogout = () => {
    sessionStorage.removeItem('b2c_admin');
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Firebase Admin
            </div>
            <h1 className="text-3xl font-black text-white">Participant Registry</h1>
            <p className="text-sm text-gray-400 mt-1">
              Live view of all registrations from Firestore cloud database
              {lastRefresh && (
                <span className="ml-2 text-gray-500">
                  · Last updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={fetchParticipants}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => exportToCSV(filtered)}
              disabled={filtered.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <div className="font-bold text-white">Firebase Error</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-gray-800">
            <div className="text-xs text-gray-400 uppercase font-mono">Total Registered</div>
            <div className="text-3xl font-black text-white mt-1">{participants.length}</div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-indigo-500/20">
            <div className="text-xs text-indigo-400 uppercase font-mono">Slots Remaining</div>
            <div className="text-3xl font-black text-indigo-400 mt-1">{Math.max(0, 40 - participants.length)}</div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
            <div className="text-xs text-amber-400 uppercase font-mono">Showing (filtered)</div>
            <div className="text-3xl font-black text-amber-400 mt-1">{filtered.length}</div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 uppercase font-mono">Avg Starting Pts</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">1000</div>
          </div>
        </div>

        {/* ── Search + Table ── */}
        <div className="glass-panel rounded-3xl border border-gray-800 overflow-hidden">
          {/* Table Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              Registered Participants
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search name, email, college…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && participants.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
              Loading from Firebase Firestore…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              {participants.length === 0 ? 'No participants registered yet.' : 'No results match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/90 text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Label</th>
                    <th className="px-4 py-3 whitespace-nowrap">Full Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Username</th>
                    <th className="px-4 py-3 whitespace-nowrap flex items-center gap-1"><Mail className="w-3 h-3" /> Email</th>
                    <th className="px-4 py-3 whitespace-nowrap"><Phone className="w-3 h-3 inline mr-1" />Phone</th>
                    <th className="px-4 py-3 whitespace-nowrap"><GraduationCap className="w-3 h-3 inline mr-1" />College</th>
                    <th className="px-4 py-3 whitespace-nowrap">Dept / Year</th>
                    <th className="px-4 py-3 whitespace-nowrap"><Coins className="w-3 h-3 inline mr-1" />Balance</th>
                    <th className="px-4 py-3 whitespace-nowrap">Links</th>
                    <th className="px-4 py-3 whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1" />Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {filtered.map((p, i) => (
                    <tr key={p.uid || i} className="hover:bg-gray-800/30 transition-colors">
                      {/* Label */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {p.anonymous_label || '—'}
                        </span>
                      </td>
                      {/* Name */}
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{p.name}</td>
                      {/* Username */}
                      <td className="px-4 py-3 font-mono text-gray-300">@{p.username}</td>
                      {/* Email */}
                      <td className="px-4 py-3 text-gray-400">
                        <a href={`mailto:${p.email}`} className="hover:text-indigo-400 transition-colors truncate max-w-[180px] block">
                          {p.email}
                        </a>
                      </td>
                      {/* Phone */}
                      <td className="px-4 py-3 font-mono text-gray-300 whitespace-nowrap">{p.phone}</td>
                      {/* College */}
                      <td className="px-4 py-3 text-gray-300 max-w-[160px]">
                        <span className="truncate block" title={p.college}>{p.college}</span>
                      </td>
                      {/* Dept / Year */}
                      <td className="px-4 py-3 text-gray-400">
                        <div className="whitespace-nowrap">{p.department}</div>
                        <div className="text-gray-500 mt-0.5">{p.year_of_study}</div>
                      </td>
                      {/* Balance */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-amber-400">{p.balance} pts</span>
                      </td>
                      {/* Links */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {p.github_profile ? (
                            <a href={p.github_profile} target="_blank" rel="noreferrer"
                              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs" title="GitHub">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>GitHub</span>
                            </a>
                          ) : <span className="text-gray-700 text-xs">—</span>}
                          {p.linkedin_profile && (
                            <a href={p.linkedin_profile} target="_blank" rel="noreferrer"
                              className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1 text-xs" title="LinkedIn">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                        </div>
                      </td>
                      {/* Registered At */}
                      <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {filtered.length} participant{filtered.length !== 1 ? 's' : ''} shown
                {search && ` (filtered from ${participants.length} total)`}
              </div>
              <button
                onClick={() => exportToCSV(filtered)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export {search ? 'filtered' : 'all'} to CSV
              </button>
            </div>
          )}
        </div>

        {/* ── Info Note ── */}
        <div className="glass-panel rounded-2xl p-4 border border-indigo-500/20 text-xs text-gray-400 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-semibold">Data Source: Firebase Firestore (cloud)</span>
            <span className="mx-2 text-gray-600">·</span>
            This page reads directly from Firestore — it works 24/7 without the Docker backend.
            On event day, run <code className="text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded">
              python manage.py sync_firebase_participants --project-id bid2code
            </code> to import these registrations into the local PostgreSQL database.
          </div>
        </div>
      </div>
    </div>
  );
};
