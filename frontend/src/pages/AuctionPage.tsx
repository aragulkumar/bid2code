import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Auction, Algorithm } from '../types';
import { 
  Gavel, 
  Flame, 
  Coins, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  TrendingUp,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Timer } from '../components/Timer';

export const AuctionPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(100);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuctionData = async () => {
    try {
      const data = await api.getActiveAuction();
      if (data && data.id) {
        setAuction(data as Auction);
        // Default bid amount suggestion: current highest + 50
        if (data.status === 'ACTIVE') {
          setBidAmount(prev => Math.max(prev, (data.current_highest_bid || 0) + 50));
        }
      } else {
        setAuction(null);
      }
    } catch (err) {
      console.error('Error polling auction:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlgorithms = async () => {
    try {
      const algos = await api.getAlgorithms();
      setAlgorithms(algos);
    } catch (err) {
      console.error('Error fetching algorithms:', err);
    }
  };

  useEffect(() => {
    fetchAuctionData();
    fetchAlgorithms();

    // Poll every 1.5 seconds for live bid updates
    const interval = setInterval(() => {
      fetchAuctionData();
      refreshUser();
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || auction.status !== 'ACTIVE') {
      setMessage({ type: 'error', text: 'No active auction accepting bids.' });
      return;
    }

    if (user && user.has_algorithm) {
      setMessage({ type: 'error', text: 'You have already secured an algorithm and cannot bid.' });
      return;
    }

    if (user && bidAmount > user.balance) {
      setMessage({ type: 'error', text: `Bid exceeds your balance (${user.balance} pts).` });
      return;
    }

    if (bidAmount <= (auction.current_highest_bid || 0)) {
      setMessage({ type: 'error', text: `Bid must be greater than current highest bid (${auction.current_highest_bid} pts).` });
      return;
    }

    setIsPlacingBid(true);
    setMessage(null);

    try {
      await api.placeBid(auction.id, bidAmount);
      setMessage({ type: 'success', text: `Placed bid of ${bidAmount} points successfully!` });
      await fetchAuctionData();
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to place bid.' });
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Gavel className="w-3.5 h-3.5" />
              <span>Live Algorithm Auction Floor</span>
            </div>
            <h1 className="text-3xl font-black text-white">Algorithm Bidding Room</h1>
          </div>

          {user && (
            <div className="flex items-center gap-3 bg-gray-900/80 px-4 py-2.5 rounded-2xl border border-gray-800">
              <div>
                <div className="text-[10px] text-gray-400 font-mono uppercase">Your Balance</div>
                <div className="text-xl font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  <span>{user.balance}</span>
                  <span className="text-xs text-gray-400 font-normal">pts</span>
                </div>
              </div>
              <div className="border-l border-gray-800 pl-3">
                <div className="text-[10px] text-gray-400 font-mono uppercase">ID</div>
                <div className="text-sm font-bold text-white font-mono">{user.anonymous_label}</div>
              </div>
            </div>
          )}
        </div>

        {/* Lock Banner if participant already has algorithm */}
        {user?.has_algorithm && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glow-emerald">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Algorithm Secured: {user.algorithm_assigned_name}</span>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  You have already acquired an algorithm and are locked from bidding in remaining cycles.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs whitespace-nowrap transition-all"
            >
              Go to Dashboard & Start Coding
            </Link>
          </div>
        )}

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Live Auction Spotlight */}
        {isLoading ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Connecting to live auction feed...</p>
          </div>
        ) : auction && auction.status === 'ACTIVE' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Active Algorithm Details & Bid Action */}
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-10 border border-purple-500/30 relative overflow-hidden glow-brand">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
                    CYCLE #{auction.cycle_number}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold uppercase">
                    {auction.algorithm_details?.difficulty || 'Medium'} Difficulty
                  </span>
                </div>

                {/* 45s Countdown Timer */}
                <Timer
                  initialSeconds={auction.remaining_seconds}
                  size="md"
                  label="Auction Clock"
                />
              </div>

              {/* Algorithm Title */}
              <div className="mb-6">
                <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
                  CURRENT AUCTIONED ALGORITHM
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                  <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
                  <span>{auction.algorithm_details?.name}</span>
                </h2>
                <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                  {auction.algorithm_details?.description}
                </p>
              </div>

              {/* Slot Availability */}
              <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs text-gray-400">Slot Availability</div>
                    <div className="text-sm font-bold text-white">
                      {auction.algorithm_details?.assigned_slots} / {auction.algorithm_details?.total_slots} Slots Assigned
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {auction.algorithm_details?.remaining_slots} Remaining
                </div>
              </div>

              {/* Bid Placement Form */}
              <div className="pt-6 border-t border-gray-800">
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Coins className="w-5 h-5 text-amber-400" />
                      </div>
                      <input
                        type="number"
                        min={(auction.current_highest_bid || 0) + 1}
                        max={user?.balance || 1000}
                        step="10"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                        disabled={user?.has_algorithm || isPlacingBid}
                        placeholder="Enter bid amount"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-900/90 border border-purple-500/40 text-white font-mono text-lg font-bold focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 disabled:opacity-50 transition-all"
                      />
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center gap-2">
                      {[+50, +100, +200].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setBidAmount(prev => Math.min(user?.balance || 1000, (auction.current_highest_bid || 0) + inc))}
                          disabled={user?.has_algorithm}
                          className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono text-gray-300 border border-gray-700 disabled:opacity-40"
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={user?.has_algorithm || isPlacingBid}
                      className="px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/30 disabled:opacity-40 transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
                    >
                      {isPlacingBid ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Gavel className="w-5 h-5" />
                          <span>Place Bid</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Col: Live Bids Ladder */}
            <div className="glass-panel rounded-3xl p-6 border border-gray-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>Live Bid Feed</span>
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">Anonymous IDs</span>
                </div>

                {auction.recent_bids && auction.recent_bids.length > 0 ? (
                  <div className="space-y-2.5">
                    {auction.recent_bids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          index === 0
                            ? 'bg-purple-600/20 border-purple-500/40 text-purple-200'
                            : 'bg-gray-900/60 border-gray-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            index === 0 ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-mono text-xs font-bold">{bid.participant_label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm font-black text-amber-400">
                            {bid.amount} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No bids placed yet in this cycle. Be the first to bid!
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-gray-500 leading-relaxed">
                Rules: Highest bid when the 45s clock expires wins the algorithm. Only the winning bid is deducted.
              </div>
            </div>
          </div>
        ) : (
          /* When no auction is actively running */
          <div className="glass-panel rounded-3xl p-10 text-center max-w-2xl mx-auto border border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Next Auction Standby</h2>
            <p className="text-sm text-gray-400 mt-2">
              The organizer or administrator will trigger the next 45-second algorithm cycle shortly. Please stay on this page.
            </p>
            {user?.is_staff && (
              <div className="mt-6">
                <Link
                  to="/admin-portal"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Open Admin Controller</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Algorithm Catalog / Available Slots */}
        <div className="pt-6">
          <h3 className="text-lg font-black text-white mb-4">Event Algorithm Bank (40 Total Slots)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {algorithms.map((algo) => (
              <div key={algo.id} className="glass-panel rounded-2xl p-5 border border-gray-800">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-white text-sm">{algo.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {algo.remaining_slots} left
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{algo.description}</p>
                <div className="mt-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${(algo.assigned_slots / algo.total_slots) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
