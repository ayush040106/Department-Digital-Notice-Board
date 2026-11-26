import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BellRing,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/axios';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@college.edu', pass: 'Admin@123' },
  { label: 'Faculty (CSE)', email: 'faculty.cse@college.edu', pass: 'Faculty@123' },
  { label: 'Student (CSE)', email: 'student.cse@college.edu', pass: 'Student@123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.pass);
    setError('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-navy-950 via-navy-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display">CampusPulse</h1>
            <p className="text-xs text-navy-200">Department-Wise Digital Notice Board</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-indigo-200">
            Official College Communication Portal
          </span>
          <h2 className="text-4xl font-extrabold text-white leading-tight font-display">
            Stay synchronized with every department circular.
          </h2>
          <p className="text-sm text-navy-100/90 leading-relaxed">
            A centralized, role-based academic notice hub connecting college administration,
            department faculty, and students with verified announcements and PDF circulars.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-navy-100">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-indigo-300" />
              </div>
              <span>Department-isolated notice feeds &amp; circular archives</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-navy-100">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-indigo-300" />
              </div>
              <span>Priority alerts, pinned announcements &amp; expiry tracking</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-navy-100">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
              </div>
              <span>Secure role-based access for Admin, Faculty &amp; Students</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-navy-300">
          © {new Date().getFullYear()} CampusPulse Academic Notice System
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-slate-50/50">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-navy-950 font-display">CampusPulse</h1>
              <p className="text-xs text-slate-500">Digital Notice Board</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-navy-950 font-display">Sign in to Portal</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your college credentials to access your notice board.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-navy-900 hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick Fill Seeded Accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="px-2.5 py-2 rounded-lg text-xs font-medium text-navy-800 bg-navy-50 hover:bg-indigo-50 hover:text-indigo-700 border border-navy-100 transition-colors text-center"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New student?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Register your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
