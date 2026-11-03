import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { BellRing, Plus, Layers, RefreshCw, CheckCircle, Radio } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { activeUser, addRawLog } = useUser();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Custom alert form state
  const [symbol, setSymbol] = useState<string>('RELIANCE.NS');
  const [condition, setCondition] = useState<string>('above');
  const [value, setValue] = useState<string>('2900');
  const [label, setLabel] = useState<string>('Key Breakout Level');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/list?user=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.rules || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [activeUser]);

  const handleAddFromPlan = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/alerts/add-from-plan?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST'
      });
      const data = await res.json();
      addRawLog({ title: 'Alerts: Add From Plan', command: data.command, stdout: data.stdout, stderr: data.stderr });
      await fetchAlerts();
      setMessage('Successfully added stop, target, and flat-by-close alerts from active plan.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/alerts/add-rule?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, condition, value, label })
      });
      const data = await res.json();
      addRawLog({ title: `Alert: ${symbol} ${condition} ${value}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      await fetchAlerts();
      setMessage(`Alert rule added for ${symbol}.`);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BellRing className="w-6 h-6 text-primary" />
            <span>Active Price & Time Alerts</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time notifications when a stock hits your stop, target, or key price boundary.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-border text-xs text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Alert Daemon Active</span>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-slate-900 border border-border flex items-center space-x-2 text-xs text-slate-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Add Alert Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Add from Plan */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm">
            <Layers className="w-4 h-4 text-primary" />
            <span>Sync Active Plan Alerts</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically registers your stop-loss price, take-profit price, and 3:55 PM market flattening alert from your active trade plan.
          </p>
          <button
            onClick={handleAddFromPlan}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
          >
            Import Plan Alerts
          </button>
        </div>

        {/* Add Custom Price Alert Form */}
        <form onSubmit={handleAddCustomAlert} className="md:col-span-2 p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="text-slate-200 font-semibold text-sm">Create Custom Price Rule</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="above">Price Above (&gt;=)</option>
                <option value="below">Price Below (&lt;=)</option>
                <option value="stop">Stop Loss Hit</option>
                <option value="target">Target Hit</option>
                <option value="at">Specific Time (HH:MM)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Price / Time</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary"
                placeholder="2900 or 15:15"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Label Note</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary"
                placeholder="Resistance"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
            >
              Add Alert Rule
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Configured Rules ({alerts.length})</h2>
          <button
            onClick={fetchAlerts}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 italic">No alert rules configured yet for trader {activeUser}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-slate-500">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Trigger Condition</th>
                  <th className="py-2.5 px-3">Level / Time</th>
                  <th className="py-2.5 px-3">Label</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-slate-300">
                {alerts.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-white">{rule.symbol || 'SYSTEM'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rule.above ? 'Above' : rule.below ? 'Below' : rule.stop ? 'Stop' : rule.target ? 'Target' : 'Time'}</td>
                    <td className="py-2.5 px-3 font-bold text-primary">{rule.above || rule.below || rule.stop || rule.target || rule.at || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rule.label || rule.note || '—'}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">ARMED</td>
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
