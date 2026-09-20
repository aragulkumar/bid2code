import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gavel, 
  Clock, 
  Terminal, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[400px] bg-indigo-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>IEEE Computer Society • 29 September 2026</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
            BIT<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">2CODE</span>
          </h1>

          <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-200">
            Bid Smart. Code Smarter.
          </p>

          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            BIT2CODE is an online coding challenge where participants compete in a live algorithm auction, secure an algorithm through strategic bidding, and solve tailored coding problems with a personal 40-minute countdown.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
            >
              <span>Register Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-gray-300 bg-gray-900/80 hover:bg-gray-800/90 border border-gray-700/70 hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              <span>Sign In to Arena</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-indigo-400">1000</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Virtual Points</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-purple-400">45s</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Auction Cycle</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-pink-400">40m</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Personal Timer</div>
            </div>
            <div className="glass-panel rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">40</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Max Coders</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step How It Works Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Event Workflow</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">How It Works in 4 Steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="glass-panel-interactive rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 text-4xl font-black text-gray-800 select-none">01</div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. Register</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Create your participant account and instantly receive 1000 virtual points credited to your contest wallet.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel-interactive rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 text-4xl font-black text-gray-800 select-none">02</div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Gavel className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Bid</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enter the live 45-second algorithm auction. Strategically bid your points to acquire your preferred algorithm.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel-interactive rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 text-4xl font-black text-gray-800 select-none">03</div>
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Code</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Once your algorithm is assigned, your personal 40-minute coding timer starts immediately without waiting for others.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel-interactive rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 text-4xl font-black text-gray-800 select-none">04</div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">4. Submit</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Solve 1 Medium problem matching your algorithm + 1 Random Easy problem. Receive instantaneous sandboxed grading.
            </p>
          </div>
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Rules & Format</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">Competition Specifications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Algorithm Auction</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Each algorithm has limited slots (e.g. 5 slots).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Only the winning bid is deducted from wallet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>Unallocated coders receive random available slots.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Individual 40m Timer</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>Coding start time is individual upon acquisition.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>Authoritative server timestamp countdown.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span>Submissions auto-lock upon timer expiration.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Automated Judging</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Sandboxed execution via Judge0 CE.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Supported: Python 3, C++ (GCC), Java (OpenJDK).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Objective scoring: 100 pts Medium + 100 pts Easy.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
