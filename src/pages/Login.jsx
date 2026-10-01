import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../service/api';
import { useAuth } from '../service/auth';
import loginIllustration from '../assets/sample.png';

export default function Login() {
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi(username.trim(), password);
      const data = res.data;

      if (!data?.success) {
        setError(data?.error || 'Login failed');
        return;
      }

      setAuthToken(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ⬇️ h-screen + overflow-hidden = no page scroll
    <div className="h-screen w-screen overflow-hidden flex bg-[#F3F4F6] font-sans">

      {/* ==================== LEFT: IMAGE ==================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 shrink-0">

        {/* Animated background blobs */}
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-10 py-8">

          {/* Illustration — capped size so it never overflows */}
          <img
            src={loginIllustration}
            alt="Command Center"
           className="w-auto max-w-[85%] max-h-[55vh] object-contain drop-shadow-2xl mb-6"
          />

          {/* Text */}
          <div className="text-center max-w-md">
            <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tight mb-2">
              SKILL CONTEST
            </h1>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="h-px w-8 bg-purple-400/60"></span>
              <p className="text-xs xl:text-sm font-bold text-purple-300 uppercase tracking-[0.25em]">
                Command Center
              </p>
              <span className="h-px w-8 bg-purple-400/60"></span>
            </div>
           
          </div>
        </div>
      </div>

      {/* ==================== RIGHT: FORM ==================== */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-y-auto bg-white">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 mb-3">
              <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-indigo-900 tracking-tight">
              SKILL CONTEST
            </h1>
            <p className="text-xs font-bold text-purple-600 mt-1 uppercase tracking-[0.2em]">
              Command Center
            </p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl xl:text-3xl font-black text-gray-900 tracking-tight">
              Welcome back 👋
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-2">
              Sign in to access the Command Center dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-[0.15em] mb-2">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-600 transition pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-[0.15em] mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-600 transition pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>

              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}