import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Sprout, Lock, Mail, Key } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('Ludhiana');
  const [role, setRole] = useState<'farmer' | 'authority'>('farmer');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  if (!isOpen) return null;

  const handleQuickSwitch = async (targetRole: 'farmer' | 'authority') => {
    setLoading(true);
    setMsg(null);
    try {
      if (targetRole === 'farmer') {
        const res = await api.login('ramesh.kumar@farm.in', 'farmer123', 'farmer');
        onUserChange({
          id: res.user.id || 1,
          email: res.user.email || 'ramesh.kumar@farm.in',
          role: 'farmer',
          district: res.user.district || 'Ludhiana',
          token: res.access_token,
        });
      } else {
        const res = await api.login('admin@gobardhan.gov.in', 'admin123', 'authority');
        onUserChange({
          id: res.user.id || 99,
          email: res.user.email || 'admin@gobardhan.gov.in',
          role: 'authority',
          district: 'National HQ',
          token: res.access_token,
        });
      }
      onClose();
    } catch {
      // Fallback switch
      onUserChange({
        id: targetRole === 'farmer' ? 1 : 99,
        email: targetRole === 'farmer' ? 'ramesh.kumar@farm.in' : 'admin@gobardhan.gov.in',
        role: targetRole,
        district: targetRole === 'farmer' ? 'Ludhiana' : 'National HQ',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === 'login') {
        const res = await api.login(email, password, role);
        onUserChange({
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          district: res.user.district,
          token: res.access_token,
        });
        setMsg({ text: 'Logged in successfully!', error: false });
        setTimeout(onClose, 800);
      } else {
        await api.register(email, password, district, role);
        setMsg({ text: 'Account registered! You can now log in.', error: false });
        setMode('login');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Authentication error', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Access & User Profile</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1">
            ✕
          </button>
        </div>

        {/* 1-Click Fast Switch Demo Cards */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Persona Switch
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickSwitch('farmer')}
              disabled={loading}
              className={`p-3 rounded-xl border text-left transition ${
                currentUser.role === 'farmer'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>Farmer View</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">ramesh.kumar@farm.in</div>
              <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Ludhiana District</div>
            </button>

            <button
              onClick={() => handleQuickSwitch('authority')}
              disabled={loading}
              className={`p-3 rounded-xl border text-left transition ${
                currentUser.role === 'authority'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Authority Hub</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">admin@gobardhan.gov.in</div>
              <div className="text-[10px] text-cyan-400/80 font-mono mt-1">National HQ</div>
            </button>
          </div>
        </div>

        {/* Custom Credentials Form */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-300">
              {mode === 'login' ? 'Or Sign In with Credentials' : 'Create New Account'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              {mode === 'login' ? 'Register New' : 'Back to Login'}
            </button>
          </div>

          {msg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium mb-3 ${
                msg.error
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white pl-8 font-medium"
                />
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white pl-8 font-medium"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'farmer' | 'authority')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="authority">Authority</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition mt-2"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
