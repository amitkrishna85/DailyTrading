import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { UserConfig } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle,
  Shield,
  Clock,
  IndianRupee,
  Sliders,
  Download,
  Upload
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { config, activeUser, updateConfig, resetConfig } = useUser();
  const [formData, setFormData] = useState<UserConfig | null>(config);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (!formData) {
    return <div className="p-8 text-center text-slate-500">Loading trader configuration...</div>;
  }

  const handleChange = (field: keyof UserConfig, val: any) => {
    setFormData(prev => prev ? { ...prev, [field]: val } : null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setLoading(true);
    setSaveStatus(null);
    const success = await updateConfig(formData);
    setLoading(false);
    if (success) {
      setSaveStatus('Trader configuration saved successfully.');
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset this trader configuration to repository defaults?')) {
      await resetConfig();
      setSaveStatus('Configuration reset to default template.');
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const applyIndiaPreset = () => {
    setFormData(prev => prev ? {
      ...prev,
      budget: 500000,
      max_loss_per_trade_usd: 5000,
      max_daily_loss_usd: 15000,
      no_entries_before: '09:20',
      no_entries_after: '14:30',
      flat_by: '15:15',
      broker: 'paper',
      paper: true
    } : null);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `config_${activeUser}.json`);
    dlAnchor.click();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>Trader Configuration: {activeUser}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure risk thresholds, position sizing equations, trading hours, and broker modes.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={applyIndiaPreset}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            🇮🇳 Reset to NSE Preset (₹5L Budget)
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Capital & Risk Limits */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <IndianRupee className="w-4 h-4 text-sky-400" />
            <span>Capital Allocation & Stop Limits (INR ₹)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account Budget (₹)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => handleChange('budget', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Cash Buffer (%)</label>
              <input
                type="number"
                value={formData.cash_buffer_pct}
                onChange={(e) => handleChange('cash_buffer_pct', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Position Cap (%)</label>
              <input
                type="number"
                value={formData.max_position_pct}
                onChange={(e) => handleChange('max_position_pct', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Loss Per Trade (₹)</label>
              <input
                type="number"
                value={formData.max_loss_per_trade_usd}
                onChange={(e) => handleChange('max_loss_per_trade_usd', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-rose-400 font-mono font-bold focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Daily Loss (₹)</label>
              <input
                type="number"
                value={formData.max_daily_loss_usd}
                onChange={(e) => handleChange('max_daily_loss_usd', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-rose-400 font-mono font-bold focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Min Reward:Risk Ratio</label>
              <input
                type="number"
                step="0.1"
                value={formData.min_reward_risk}
                onChange={(e) => handleChange('min_reward_risk', Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Session Hours & Flat-by Rule */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Trading Window & Intraday Flattening</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">No Entries Before (HH:MM)</label>
              <input
                type="text"
                value={formData.no_entries_before}
                onChange={(e) => handleChange('no_entries_before', e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">No Entries After (HH:MM)</label>
              <input
                type="text"
                value={formData.no_entries_after}
                onChange={(e) => handleChange('no_entries_after', e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Force Flat By (HH:MM)</label>
              <input
                type="text"
                value={formData.flat_by}
                onChange={(e) => handleChange('flat_by', e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Safety Toggles */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Safety & Broker Execution Flags</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-950 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_stop}
                onChange={(e) => handleChange('require_stop', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Require Stop-Loss</div>
                <div className="text-[11px] text-slate-400">Never place an order without a pre-calculated stop.</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-950 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.paper}
                onChange={(e) => handleChange('paper', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Paper Trading Mode</div>
                <div className="text-[11px] text-slate-400">Simulate order execution safely without real money.</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-950 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pdt_guard}
                onChange={(e) => handleChange('pdt_guard', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Intraday Trade Guard</div>
                <div className="text-[11px] text-slate-400">Enforce maximum intraday trades limit.</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-950 border border-border cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fractional}
                onChange={(e) => handleChange('fractional', e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Allow Fractional Shares</div>
                <div className="text-[11px] text-slate-400">Allow non-integer share quantity sizing.</div>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Exchange User Agent / Header</label>
            <input
              type="text"
              value={formData.sec_user_agent}
              onChange={(e) => handleChange('sec_user_agent', e.target.value)}
              className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary"
              placeholder="Your Name yourname@example.com"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={exportJSON}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-border text-xs text-slate-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Config JSON</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-border text-xs text-rose-400 hover:bg-rose-950/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
