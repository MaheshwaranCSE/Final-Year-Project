import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiAuth } from '../lib/apiAuth';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { Role } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      const paths: Record<Role, string> = {
        user: '/user/dashboard',
        police: '/police/dashboard',
        doctor: '/doctor/dashboard',
        court: '/court/dashboard',
        admin: '/admin/dashboard',
        investigator: '/investigator-dashboard',
      };
      navigate(paths[role as Role] || '/');
    }
  }, [user, role, navigate]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [roleInput, setRoleInput] = useState('user');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await apiAuth.register(email, password, name, roleInput);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during authentication');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060911] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_24px_64px_rgba(0,0,0,0.85)] rounded-2xl p-8 max-w-md w-full relative z-10 space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
              SECURE FORENSIC SUITE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            BlockVault Access Portal
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Digital Forensic Evidence Management & Chain of Custody
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {isRegistering && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Officer / Examiner Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Assigned Role
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                >
                  <option value="user" className="bg-[#0C101D] text-white">User / Witness</option>
                  <option value="police" className="bg-[#0C101D] text-white">Law Enforcement Officer</option>
                  <option value="doctor" className="bg-[#0C101D] text-white">Medical Examiner / Doctor</option>
                  <option value="court" className="bg-[#0C101D] text-white">Judicial Officer / Court</option>
                  <option value="admin" className="bg-[#0C101D] text-white">System Administrator</option>
                  <option value="investigator" className="bg-[#0C101D] text-white">Forensic Lead Investigator</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              User Identifier / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. USR-00001 or investigator@blockvault.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Authentication Secret / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold font-mono text-xs transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(6,182,212,0.25)] active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? (isRegistering ? 'Registering...' : 'Authenticating...') : (isRegistering ? 'Register Credentials' : 'Authenticate Session')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-center text-xs font-mono text-zinc-400 hover:text-cyan-400 transition pt-1"
          >
            {isRegistering ? 'Already enrolled? Sign In' : 'Need new operator credentials? Register'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block text-center">
              Quick Development Demo Logins
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => { setEmail('USR-00001'); setPassword('BlockVault@Usr01!'); }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-cyan-400 transition"
              >
                User
              </button>
              <button
                type="button"
                onClick={() => { setEmail('POL-00001'); setPassword('BlockVault@Pol01!'); }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-cyan-400 transition"
              >
                Police
              </button>
              <button
                type="button"
                onClick={() => { setEmail('DOC-00001'); setPassword('BlockVault@Doc01!'); }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-cyan-400 transition"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => { setEmail('CRT-00001'); setPassword('BlockVault@Crt01!'); }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-cyan-400 transition"
              >
                Court
              </button>
              <button
                type="button"
                onClick={() => { setEmail('ADM-00001'); setPassword('BlockVault@Adm01!'); }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition"
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
