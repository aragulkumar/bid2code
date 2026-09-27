import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  registerParticipantWithFirebase, 
  getParticipantCount, 
  getRegistrationStatus,
  MAX_PARTICIPANTS 
} from '../services/firebase';
import { 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Cloud, 
  Users, 
  Lock,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/HJ4FzfHLlOU8bH7Ie31eR9';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    year_of_study: 'Year 2',
    username: '',
    password: '',
    confirm_password: '',
    github_profile: '',
    linkedin_profile: '',
    agree_terms: false
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(true);
  const [registeredData, setRegisteredData] = useState<{ name: string; username: string; label: string; email: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch current participant count and registration status on mount
  useEffect(() => {
    getParticipantCount()
      .then(count => setParticipantCount(count))
      .catch(() => setParticipantCount(null));

    getRegistrationStatus()
      .then(open => setIsRegistrationOpen(open))
      .catch(() => setIsRegistrationOpen(true));
  }, []);

  const isFull = participantCount !== null && participantCount >= MAX_PARTICIPANTS;
  const isClosed = !isRegistrationOpen || isFull;
  const slotsLeft = participantCount !== null ? Math.max(0, MAX_PARTICIPANTS - participantCount) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(WHATSAPP_GROUP_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.agree_terms) {
      setError("You must agree to the BID2CODE event rules.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save to Firebase Firestore (24/7 cloud availability)
      const savedDoc = await registerParticipantWithFirebase(formData);

      // 2. Best effort sync with Django backend if active
      register(formData).catch(() => {});

      // 3. Show persistent confirmation screen with WhatsApp group link
      setRegisteredData({
        name: formData.full_name,
        username: formData.username,
        label: savedDoc?.anonymous_label || 'P01',
        email: formData.email,
      });

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Persistent Post-Registration Screen with WhatsApp Group ───────────────
  if (registeredData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full">
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-emerald-500/30 text-center relative overflow-hidden shadow-2xl shadow-emerald-950/50">
            {/* Top decorative glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Registration Confirmed
            </div>

            <h1 className="text-3xl font-black text-white">Welcome to BID2CODE 2026!</h1>
            <p className="text-gray-300 text-sm mt-2">
              Your registration has been securely recorded. You are assigned contestant ID{' '}
              <span className="font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {registeredData.label}
              </span>
              {' '}with <span className="text-amber-400 font-bold inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 inline" /> 1,000 virtual points</span>.
            </p>

            {/* ── Official WhatsApp Group Card ── */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-emerald-950/20 border-2 border-emerald-500/40 text-left relative overflow-hidden shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                  <MessageCircle className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Mandatory Next Step
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Join the Official WhatsApp Group
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    All live algorithm auction updates, problem arena links, and contest instructions will be broadcast exclusively in this group. You must join to participate on <strong>29 September 2026 (6:15 PM – 8:00 PM)</strong>.
                  </p>
                </div>
              </div>

              {/* Join WhatsApp Button */}
              <div className="mt-5 space-y-3">
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20ba59] shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2.5 text-base transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Join Official WhatsApp Group</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Copy Link Helper */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900/90 border border-gray-700/80 text-gray-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-all hover:bg-gray-800"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Group Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">Copy Link: {WHATSAPP_GROUP_URL}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Note that this screen persists until exit */}
            <p className="text-xs text-gray-500 mt-4">
              📌 This screen will remain open until you exit. Please join the WhatsApp group now before proceeding.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/login"
                className="w-full sm:w-1/2 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Sign In to Arena</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/"
                className="w-full sm:w-1/2 py-3 rounded-xl font-semibold text-gray-300 bg-gray-900/80 hover:bg-gray-800 border border-gray-700/70 hover:text-white text-center transition-all"
              >
                Exit to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Participant Onboarding</span>
          </div>
          <h1 className="text-3xl font-black text-white">Join BID2CODE 2026</h1>
          <p className="text-sm text-gray-400 mt-2">
            Every registered participant receives <span className="text-amber-400 font-semibold inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 inline" /> 1000 virtual auction points</span>.
          </p>

          {/* Live slot counter */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
            style={{
              backgroundColor: isClosed ? 'rgba(239,68,68,0.1)' : slotsLeft !== null && slotsLeft <= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              borderColor: isClosed ? 'rgba(239,68,68,0.3)' : slotsLeft !== null && slotsLeft <= 5 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
              color: isClosed ? '#f87171' : slotsLeft !== null && slotsLeft <= 5 ? '#fbbf24' : '#34d399',
            }}
          >
            <Users className="w-4 h-4" />
            {!isRegistrationOpen
              ? '🔒 Registration Paused by Organizer'
              : participantCount === null
              ? 'Checking availability…'
              : isFull
              ? '🔒 Registration Closed — Event Full (40/40)'
              : slotsLeft === 1
              ? '⚡ Only 1 slot remaining!'
              : slotsLeft !== null && slotsLeft <= 5
              ? `⚡ Only ${slotsLeft} slots left!`
              : `${slotsLeft} of ${MAX_PARTICIPANTS} slots available`
            }
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-gray-800">
          {/* Registration Paused by Organizer Banner */}
          {!isRegistrationOpen && (
            <div className="mb-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-center">
              <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-amber-300 font-black text-lg">Registration is Paused</div>
              <div className="text-amber-400/80 text-sm mt-1">
                The event organizers have temporarily closed new registrations. Please check back soon or contact organizers.
              </div>
            </div>
          )}

          {/* Registration Full Banner */}
          {isRegistrationOpen && isFull && (
            <div className="mb-6 p-5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-center">
              <Lock className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <div className="text-rose-300 font-black text-lg">Registration is Closed</div>
              <div className="text-rose-400/80 text-sm mt-1">
                BID2CODE 2026 has reached its maximum capacity of <strong>40 participants</strong>.
              </div>
              <div className="text-gray-500 text-xs mt-2">
                Contact the IEEE CS organizers if you believe this is an error.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}


          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="alex_coder"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* College */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  College / Institution *
                </label>
                <input
                  type="text"
                  name="college"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="MIT Campus / PSG Tech"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Year of Study *
                </label>
                <select
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="Year 1">1st Year</option>
                  <option value="Year 2">2nd Year</option>
                  <option value="Year 3">3rd Year</option>
                  <option value="Year 4">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                placeholder="Computer Science and Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GitHub */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  GitHub Profile (Optional)
                </label>
                <input
                  type="text"
                  name="github_profile"
                  value={formData.github_profile}
                  onChange={handleChange}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  LinkedIn Profile (Optional)
                </label>
                <input
                  type="text"
                  name="linkedin_profile"
                  value={formData.linkedin_profile}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/80 border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agree_terms"
                  checked={formData.agree_terms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded text-indigo-600 bg-gray-900 border-gray-700 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-400 leading-normal">
                  I agree to participate in BID2CODE and follow the IEEE CS event rules, strategic auction guidelines, and coding ethics.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isClosed}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2 ${
                  isClosed
                    ? 'bg-gray-700 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {isSubmitting ? (
                  <span>Registering to Cloud...</span>
                ) : !isRegistrationOpen ? (
                  <>
                    <Lock className="w-5 h-5 text-gray-400" />
                    <span>Registration Paused by Organizer</span>
                  </>
                ) : isFull ? (
                  <>
                    <Lock className="w-5 h-5 text-gray-400" />
                    <span>Registration Closed (Event Full)</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5 text-indigo-200" />
                    <span>Complete Registration (1000 Pts)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
