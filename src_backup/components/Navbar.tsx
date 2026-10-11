import React from 'react';
import { Sprout, Activity, ShieldCheck, Cpu, UserCheck, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'telemetry' | 'predict' | 'authority' | 'devices';
  setActiveTab: (tab: 'telemetry' | 'predict' | 'authority' | 'devices') => void;
  currentUser: UserProfile;
  backendHealthy: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  backendHealthy,
  onRefresh,
  isRefreshing,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Sprout className="w-6 h-6 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  GOBARdhan
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  IoT + AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Smart Manure Monitoring & Crop Suitability Prediction
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-telemetry"
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Telemetry</span>
            </button>

            <button
              id="tab-predict"
              onClick={() => setActiveTab('predict')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'predict'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sprout className="w-4 h-4 text-amber-400" />
              <span>AI Crop Predictor</span>
            </button>

            <button
              id="tab-authority"
              onClick={() => setActiveTab('authority')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'authority'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Authority Command</span>
            </button>

            <button
              id="tab-devices"
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'devices'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">ESP32 Simulator</span>
              <span className="md:hidden">IoT</span>
            </button>
          </nav>

          {/* Right Status & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Backend status pill */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                backendHealthy
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
              }`}
              title="FastAPI Port 8000 Connection Status"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  backendHealthy ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                }`}
              />
              <span>{backendHealthy ? 'API Connected' : 'Offline Mode'}</span>
            </div>

            {/* Refresh button */}
            <button
              id="refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Active User / Role Badge */}
            <button
              id="user-profile-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                  {currentUser.email.split('@')[0]}
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  {currentUser.role}
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
