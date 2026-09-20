import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Coins, 
  Gavel, 
  Terminal, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Code2, 
  Award, 
  AlertCircle 
} from 'lucide-react';
import { Timer } from '../components/Timer';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isStartingCoding, setIsStartingCoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  const handleStartCoding = async () => {
    setIsStartingCoding(true);
    setErrorMsg(null);
    try {
      await api.startCoding();
      await refreshUser();
      navigate('/arena');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start coding session.');
      setIsStartingCoding(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (user.is_coding) {
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-wider glow-rose">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Coding Session in Progress</span>
        </div>
      );
    }
    if (user.is_coding_finished) {
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          <span>Coding Session Ended</span>
        </div>
      );
    }
    if (user.has_algorithm) {
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider glow-emerald">
          <Sparkles className="w-4 h-4" />
          <span>Algorithm Assigned: {user.algorithm_assigned_name}</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
        <Gavel className="w-4 h-4" />
        <span>Waiting for Live Auction</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-gray-800 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 font-mono text-xs font-bold">
                  {user.anonymous_label}
                </span>
                {getStatusBadge()}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white">
                Welcome, {user.name}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {user.college || 'Participant'} • {user.department || 'Competitor'}
              </p>
            </div>

            {/* Quick Balance & Timer Card */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
              <div className="px-4 py-2 border-r border-gray-800">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">Contest Wallet</div>
                <div className="text-2xl font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-6 h-6" />
                  <span>{user.balance}</span>
                  <span className="text-xs text-gray-400 font-normal">pts</span>
                </div>
              </div>

              {user.is_coding && (
                <div className="px-4 py-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-mono mb-1">Coding Timer</div>
                  <Timer initialSeconds={user.remaining_coding_seconds} size="md" />
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Auction Room */}
          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Algorithm Auction Room</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {user.has_algorithm
                  ? `You have already secured ${user.algorithm_assigned_name}. You are locked from subsequent bidding rounds.`
                  : 'Join the live 45-second algorithm auctions and bid your points to secure your target algorithm.'}
              </p>
            </div>

            <div className="mt-8">
              <Link
                to="/auction"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{user.has_algorithm ? 'View Auction Floor' : 'Enter Live Auction'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Coding Arena */}
          <div className="glass-panel-interactive rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Monaco Code Arena</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {!user.has_algorithm
                  ? 'Locked until an algorithm is assigned either via winning auction bid or random allocation.'
                  : user.is_coding
                  ? 'Your personal 40-minute coding timer is ticking! Submit your solutions for automatic sandboxed evaluation.'
                  : user.is_coding_finished
                  ? 'Your 40-minute coding window has concluded. View your submissions and scores.'
                  : 'Your algorithm is ready! Click Start Coding whenever you are prepared to begin your personal 40-minute timer.'}
              </p>
            </div>

            <div className="mt-8">
              {!user.has_algorithm ? (
                <button
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-gray-500 bg-gray-800 cursor-not-allowed"
                >
                  Waiting for Algorithm Assignment
                </button>
              ) : user.is_coding || user.is_coding_finished ? (
                <Link
                  to="/arena"
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Open Code Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={handleStartCoding}
                  disabled={isStartingCoding}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {isStartingCoding ? (
                    <span>Starting Session...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start 40-Minute Coding Session</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Algorithm Spotlight */}
        {user.has_algorithm && (
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-indigo-500/20 glow-brand">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400 font-semibold tracking-wider">
                  Your Secured Topic
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {user.algorithm_assigned_name}
                </h2>
                <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                  You will receive 1 Medium problem strictly requiring {user.algorithm_assigned_name} algorithms plus 1 random Easy problem from the global challenge bank.
                </p>
              </div>

              {!user.is_coding && !user.is_coding_finished && (
                <button
                  onClick={handleStartCoding}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
                >
                  Start Coding Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
