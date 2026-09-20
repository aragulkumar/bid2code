import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Code2, 
  Gavel, 
  Trophy, 
  LayoutDashboard, 
  Terminal, 
  ShieldAlert, 
  LogOut, 
  UserPlus, 
  LogIn,
  Coins
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                  BIT<span className="text-indigo-400">2</span>CODE
                </span>
                <span className="block text-[10px] text-gray-400 font-mono tracking-wider uppercase">IEEE CS Event</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/dashboard') ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/auction"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/auction') ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Gavel className="w-4 h-4" />
                  <span>Live Auction</span>
                </Link>
                <Link
                  to="/arena"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                    isActive('/arena') ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Code Arena</span>
                </Link>
              </>
            )}

            <Link
              to="/leaderboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive('/leaderboard') ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
            </Link>

            {user?.is_staff && (
              <Link
                to="/admin-portal"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive('/admin-portal') ? 'text-rose-400 bg-rose-500/10' : 'text-rose-300 hover:text-rose-200 hover:bg-gray-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          {/* Right Actions / Profile */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Virtual Points Tag */}
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{user.balance} pts</span>
                </div>

                {/* Participant ID */}
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white font-mono">{user.anonymous_label}</div>
                  <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{user.name}</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800/60 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
