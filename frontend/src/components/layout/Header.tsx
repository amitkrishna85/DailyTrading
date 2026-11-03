import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import {
  Users,
  Shield,
  Globe,
  Sparkles,
  LogOut,
  LogIn,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { OnboardingModal } from '../modals/OnboardingModal';
import { LoginModal } from '../modals/LoginModal';

export const Header: React.FC = () => {
  const {
    activeUser,
    userRole,
    marketStatus,
    config,
    logout,
    isOnboarded
  } = useUser();

  const [showOnboarding, setShowOnboarding] = useState<boolean>(!isOnboarded);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PRE-MARKET':
      case 'POST-MARKET':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Branding & Market Clocks */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
            DT
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            DayTrader AI
          </span>
        </div>

        {/* Live Indian Market Clock (IST) */}
        {marketStatus?.india && (
          <div className="hidden lg:flex items-center space-x-3 pl-6 border-l border-border text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">NSE / BSE:</span>
            <span className="font-mono text-slate-100 font-bold">{marketStatus.india.time_str}</span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wider ${getStatusColor(marketStatus.india.status)}`}>
              {marketStatus.india.status}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions, User Role, Profile & Safety */}
      <div className="flex items-center space-x-3">
        {/* Onboarding Wizard Button */}
        <button
          onClick={() => setShowOnboarding(true)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-primary/30 text-xs text-primary font-semibold hover:bg-primary/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trader Wizard</span>
        </button>

        {/* Paper/Live Trading Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Mode:</span>
          <span className="font-semibold text-emerald-400 uppercase tracking-wide">
            {config?.paper ? 'Paper' : 'Live'}
          </span>
        </div>

        {/* User Identity / Role Pill */}
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center space-x-2 bg-slate-900 border border-border rounded-lg px-3 py-1 hover:border-slate-700 transition"
        >
          {userRole === 'admin' ? (
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          ) : (
            <Users className="w-4 h-4 text-primary" />
          )}
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-tight">
              {activeUser || 'Guest Trader'}
            </div>
            <div className="text-[10px] uppercase font-mono text-slate-500">
              {userRole === 'admin' ? 'Administrator' : 'Trader'}
            </div>
          </div>
          <KeyRound className="w-3.5 h-3.5 text-slate-500 ml-1" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Modals */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </header>
  );
};
