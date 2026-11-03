import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import {
  Sparkles,
  TrendingUp,
  Wallet,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
  Check,
  ShieldCheck,
  IndianRupee
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { activeUser, completeOnboarding } = useUser();
  const [step, setStep] = useState<number>(1);
  const [strategy, setStrategy] = useState<'ORB' | 'MOMENTUM'>('ORB');
  const [budget, setBudget] = useState<number>(500000); // 5 Lakhs INR default
  const [maxLoss, setMaxLoss] = useState<number>(5000);   // 1% per trade
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(15000); // 3% daily limit
  const [paper, setPaper] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setSubmitting(true);
    await completeOnboarding({
      budget,
      maxLoss,
      maxDailyLoss,
      paper
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Welcome, <span className="text-primary">{activeUser}</span>!
            </h2>
            <p className="text-xs text-slate-400">
              Personalized Trader Onboarding -- configure your trading rules in 4 quick steps.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 border-b border-border/80 pb-3">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                step >= s ? 'bg-primary' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* --- STEP 1: MARKET & STRATEGY SELECTION --- */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">Market & Setup Focus (NSE/BSE)</div>
            <p className="text-xs text-slate-400">
              This terminal is tailored for Indian Equities (NSE Nifty 50, Bank Nifty, and Midcaps). Choose your primary setup focus:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStrategy('ORB')}
                className={`p-4 rounded-xl border text-left transition relative ${
                  strategy === 'ORB'
                    ? 'bg-primary/10 border-primary text-white shadow-md shadow-primary/10'
                    : 'bg-slate-900 border-border text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-bold text-sm text-white">Opening Range (ORB)</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">15-min Breakout Strategy</div>
                <div className="text-[10px] text-emerald-400 mt-2 font-medium">Active: 09:20 - 11:30 IST</div>
                {strategy === 'ORB' && (
                  <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setStrategy('MOMENTUM')}
                className={`p-4 rounded-xl border text-left transition relative ${
                  strategy === 'MOMENTUM'
                    ? 'bg-primary/10 border-primary text-white shadow-md shadow-primary/10'
                    : 'bg-slate-900 border-border text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-bold text-sm text-white">Trend Pullback</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">20-EMA & VWAP Reclaim</div>
                <div className="text-[10px] text-emerald-400 mt-2 font-medium">Active: 10:30 - 14:00 IST</div>
                {strategy === 'MOMENTUM' && (
                  <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                )}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-border text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">Market Hours: </span>
              09:15 - 15:30 IST | Intraday MIS Auto-Square-off at 15:15 IST
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
              >
                <span>Next: Capital & Risk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: CAPITAL & RISK SIZING --- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">Capital Allocation & Risk Rules (INR ₹)</div>
            <p className="text-xs text-slate-400">
              The golden rule: never risk more than 1% of account capital on any single setup.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Account Capital (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => {
                    const b = Number(e.target.value);
                    setBudget(b);
                    setMaxLoss(Math.round(b * 0.01));
                    setMaxDailyLoss(Math.round(b * 0.03));
                  }}
                  className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Max Risk / Trade (₹, 1%)</label>
                  <input
                    type="number"
                    value={maxLoss}
                    onChange={(e) => setMaxLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-xs text-rose-400 font-bold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Daily Stop Limit (₹, 3%)</label>
                  <input
                    type="number"
                    value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-xs text-rose-400 font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
              >
                <span>Next: Trading Hours</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: SESSION HOURS & FLATTENING --- */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">Execution Hours & Force-Flatten</div>
            <p className="text-xs text-slate-400">
              Never hold intraday trades overnight. The system automatically enforces an exit before market close.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-slate-400">Earliest Entry:</span>
                <span className="text-white font-bold">09:20 IST</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-slate-400">Latest Entry:</span>
                <span className="text-white font-bold">14:30 IST</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-amber-400 font-semibold">Force Flat-by Time:</span>
                <span className="text-amber-400 font-bold">15:15 IST</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
              >
                <span>Next: Safety Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: SAFETY & CONFIRMATION --- */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">Safety Mode & Profile Summary</div>
            <p className="text-xs text-slate-400">
              Start with Paper Trading mode so you can simulate and test without risking capital.
            </p>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">Enable Paper Trading Mode</div>
                  <div className="text-[11px] text-slate-400">Realistic execution with zero capital risk.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={paper}
                onChange={(e) => setPaper(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-border text-xs font-mono space-y-1.5 text-slate-300">
              <div>Trader: <strong className="text-primary">{activeUser}</strong></div>
              <div>Market: <strong className="text-white">NSE / BSE (IST)</strong></div>
              <div>Strategy: <strong className="text-white">{strategy === 'ORB' ? 'Opening Range Breakout' : 'Trend Pullback'}</strong></div>
              <div>Capital: <strong className="text-white">₹{budget.toLocaleString('en-IN')}</strong></div>
              <div>Max Loss/Trade: <strong className="text-rose-400">₹{maxLoss.toLocaleString('en-IN')}</strong></div>
              <div>Max Daily Loss: <strong className="text-rose-400">₹{maxDailyLoss.toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                {submitting ? 'Saving Profile...' : 'Complete Onboarding & Start Trading'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
