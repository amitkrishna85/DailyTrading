import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  ShieldCheck,
  Users,
  FileText,
  Activity,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { activeUser, userRole } = useUser();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [niftyContent, setNiftyContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/admin/metrics?user=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const json = await res.json();
        setMetrics(json);
      }
      const nres = await fetch(`/api/scanner/nifty50?user=${encodeURIComponent(activeUser)}`);
      if (nres.ok) {
        const njson = await nres.json();
        setNiftyContent(njson.content || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeUser]);

  const handleSaveNifty = async () => {
    try {
      const res = await fetch(`/api/scanner/nifty50?user=${encodeURIComponent(activeUser)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: niftyContent, update_global: true })
      });
      if (res.ok) {
        setSaveStatus('Global MyNifty50List.txt updated successfully.');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e: any) {
      setSaveStatus(`Error: ${e.message}`);
    }
  };

  const handleDeleteUser = async (targetUser: string) => {
    if (confirm(`Permanently delete trader profile "${targetUser}" and all their files?`)) {
      try {
        const res = await fetch(`/api/auth/admin/users/${encodeURIComponent(targetUser)}?user=${encodeURIComponent(activeUser)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          await fetchMetrics();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-400">
          You must be logged in as an Administrator to access user accounts, global metrics, and repository configuration files.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            <span>Administrator Control Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global system surveillance, user management, and repository file configuration.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-border text-xs text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {saveStatus && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Registered Traders</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {metrics?.total_users || 0}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Global Executed Trades</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {metrics?.total_trades_executed || 0}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Engine Mode</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-amber-400">
            Paper Trading Default
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white">Registered Trader Profiles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-slate-500">
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Onboarded</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-slate-300">
              {metrics?.users?.map((u: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-bold text-white">{u.username}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      u.role === 'admin' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                      {u.role || 'trader'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">{u.is_onboarded !== false ? 'Yes' : 'Pending'}</td>
                  <td className="py-2.5 px-3 text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {u.username !== 'admin' && u.username !== 'default' && (
                      <button
                        onClick={() => handleDeleteUser(u.username)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global MyNifty50List.txt Config Editor */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Configure MyNifty50List.txt (Global Watchlist Basket)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Edit the constituents list used by the Scanner for Indian Market daily and ORB scans.
            </p>
          </div>
          <button
            onClick={handleSaveNifty}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-sky-400 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save MyNifty50List.txt</span>
          </button>
        </div>

        <textarea
          rows={10}
          value={niftyContent}
          onChange={(e) => setNiftyContent(e.target.value)}
          className="w-full bg-slate-950 border border-border rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary leading-relaxed"
          placeholder="One ticker symbol per line, e.g. RELIANCE.NS, TCS.NS"
        />
      </div>

      {/* Global Trade Log Audit */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="text-base font-semibold text-white">Global Trade Log Audit</h2>
        {metrics?.recent_global_trades?.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 italic">No global trade tickets executed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-slate-500">
                  <th className="py-2">Time</th>
                  <th className="py-2">Trader</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Order Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-slate-300">
                {metrics?.recent_global_trades?.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 text-primary font-bold">{t.user}</td>
                    <td className="py-2 text-emerald-400 font-bold">{t.action}</td>
                    <td className="py-2 truncate max-w-sm">{JSON.stringify(t.orders || {})}</td>
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
