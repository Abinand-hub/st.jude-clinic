import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Stethoscope, LogIn, HeartPulse, Activity } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginByEmail, users, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await loginByEmail(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  const managerEmails = users.filter(u => u.role === 'manager').map(u => u.email).slice(0, 2);
  const staffEmails = users.filter(u => u.role === 'staff').map(u => u.email).slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Stethoscope className="w-12 h-12 text-blue-600" />
          <div className="text-slate-600 font-medium">Loading Medical Directory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel: Branding / Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white overflow-hidden items-center justify-center">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl opacity-50"></div>
        </div>

        <div className="relative z-10 p-12 max-w-lg flex flex-col items-start text-left">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-8 shadow-2xl">
            <HeartPulse className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            St. Jude Clinic
          </h1>
          <h2 className="text-2xl font-light text-blue-100 mb-8">
            Next-Generation Shift Management OS
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed">
            Ensure optimal coverage, streamline your staffing process, and keep your medical teams aligned with intelligent, real-time scheduling tools.
          </p>

          <div className="mt-12 flex gap-6">
            <div className="flex items-center gap-3 text-blue-100">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-sm">Real-time Sync</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <Stethoscope className="w-5 h-5 text-sky-400" />
              <span className="font-medium text-sm">Role Constraints</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Only Header */}
          <div className="flex flex-col items-center justify-center lg:hidden mb-10 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl shadow-lg mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">St. Jude Clinic</h2>
            <p className="text-slate-500 mt-2">Shift Management OS</p>
          </div>

          <div className="bg-white py-10 px-6 sm:px-10 shadow-2xl shadow-blue-900/5 sm:rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h3>
            <p className="text-sm text-slate-500 mb-8">Please enter your clinic email to continue.</p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white sm:text-sm transition-all duration-200"
                    placeholder="e.g. dr.sarah@stjude.clinic"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white sm:text-sm transition-all duration-200"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Instant Demo Access
              </h4>
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase block mb-2">Managers (Full Access)</span>
                  <div className="flex flex-wrap gap-2">
                    {managerEmails.map(e => (
                      <button key={e} onClick={() => { setEmail(e); setPassword('manager123'); }} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Staff Members (Password: staff123)</span>
                  <div className="flex flex-wrap gap-2">
                    {staffEmails.map(e => (
                      <button key={e} onClick={() => { setEmail(e); setPassword('staff123'); }} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
