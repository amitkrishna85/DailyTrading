import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { config, activeUser, setPipelineSymbol } = useUser();
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pipeline/status?user=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        setPipelineStatus(data);
      }
      const hres = await fetch(`/api/pipeline/broker/history?user=${encodeURIComponent(activeUser)}`);
      if (hres.ok) {
        const hdata = await hres.json();
        setRecentTrades(hdata.trades || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [activeUser]);

  const activePlan = pipelineStatus?.plan;
  const activeOrders = pipelineStatus?.orders;
  const activeVerdicts = pipelineStatus?.verdicts;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Trader Overview: <span className="text-primary">{activeUser}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Systematic day trading engine with active risk guardrails and Monte Carlo probability verification.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-border text-xs text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Account Capital */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Allocated Capital</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            ₹{config?.budget?.toLocaleString('en-IN') || '5,00,000'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Cash buffer: <span className="text-slate-200">{config?.cash_buffer_pct}%</span>
          </div>
        </div>

        {/* Max Loss Per Trade */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Max Risk / Trade</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            ₹{config?.max_loss_per_trade_usd?.toLocaleString('en-IN') || '5,000'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Stop required: <span className="text-emerald-400">{config?.require_stop ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Daily Circuit Breaker */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Daily Loss Limit</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            ₹{config?.max_daily_loss_usd?.toLocaleString('en-IN') || '15,000'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Max trades: <span className="text-slate-200">{config?.max_trades_per_day} / day</span>
          </div>
        </div>

        {/* Trading Hours Window */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Allowed Window (IST)</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-white">
            {config?.no_entries_before || '09:20'} - {config?.no_entries_after || '14:30'} IST
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Flat by: <span className="text-amber-400 font-semibold">{config?.flat_by || '15:15'} IST</span>
          </div>
        </div>
      </div>

      {/* Pipeline Active Trade Spotlight */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Current Active Trade Plan</h2>
              <p className="text-xs text-slate-400">Step through the pipeline to time entry, verify odds, and size order.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pipeline')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary text-slate-950 font-semibold text-xs hover:bg-sky-400 transition"
          >
            <span>Open Decision Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {activePlan ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 rounded-lg bg-slate-950 border border-border font-mono text-xs">
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Symbol</div>
              <div className="font-bold text-white text-sm">{activePlan.symbol}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Entry Target</div>
              <div className="text-sky-400 font-bold">₹{activePlan.entry}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Stop Loss</div>
              <div className="text-rose-400 font-bold">₹{activePlan.stop}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Take Profit</div>
              <div className="text-emerald-400 font-bold">₹{activePlan.target}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Reward : Risk</div>
              <div className="text-slate-200 font-bold">{activePlan.reward_risk || activePlan.rr}:1</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Risk / Share</div>
              <div className="text-amber-400 font-bold">₹{activePlan.risk_per_share || (Math.abs(activePlan.entry - activePlan.stop)).toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-lg bg-slate-950/60 border border-dashed border-border">
            <p className="text-xs text-slate-400 mb-3">No active trade plan configured yet for trader <span className="text-slate-200 font-semibold">{activeUser}</span>.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => onNavigate('scanner')}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition"
              >
                Scan Market for Setups
              </button>
              <button
                onClick={() => {
                  setPipelineSymbol('RELIANCE.NS');
                  onNavigate('pipeline');
                }}
                className="px-4 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs hover:bg-primary/30 transition"
              >
                Plan Setup for RELIANCE.NS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trade Log History */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white">Confirmed Order Execution Log</h2>
        {recentTrades.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No executed trades logged yet. Orders are only logged after risk gatekeeper passes and explicit confirmation.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-slate-500">
                  <th className="py-2">Time</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-slate-300">
                {recentTrades.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-primary">{t.user}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{t.action}</td>
                    <td className="py-2.5 text-slate-400">{t.mode}</td>
                    <td className="py-2.5 truncate max-w-xs">{JSON.stringify(t.orders || {})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
