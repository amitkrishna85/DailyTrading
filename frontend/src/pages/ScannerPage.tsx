import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  Radar,
  Play,
  ArrowRight,
  CheckCircle,
  FileText,
  Save,
  X,
  Plus
} from 'lucide-react';

interface ScannerPageProps {
  onNavigate: (tab: string) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onNavigate }) => {
  const { activeUser, setPipelineSymbol, addRawLog, userRole } = useUser();
  const [mode, setMode] = useState<string>('daily');
  const [targetList, setTargetList] = useState<string>('nifty50');
  const [customSymbols, setCustomSymbols] = useState<string>('RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS');
  const [limit, setLimit] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [hits, setHits] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Nifty 50 Editor State
  const [showNiftyModal, setShowNiftyModal] = useState<boolean>(false);
  const [niftyContent, setNiftyContent] = useState<string>('');
  const [savingNifty, setSavingNifty] = useState<boolean>(false);

  const fetchExistingWatchlist = async () => {
    try {
      const res = await fetch(`/api/scanner/watchlist?user=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.hits || json.data || [];
        if (Array.isArray(list)) setHits(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadNiftyList = async () => {
    try {
      const res = await fetch(`/api/scanner/nifty50?user=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const json = await res.json();
        setNiftyContent(json.content || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExistingWatchlist();
    loadNiftyList();
  }, [activeUser]);

  const handleSaveNifty = async () => {
    setSavingNifty(true);
    try {
      const res = await fetch(`/api/scanner/nifty50?user=${encodeURIComponent(activeUser)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: niftyContent,
          update_global: userRole === 'admin'
        })
      });
      if (res.ok) {
        setMessage('MyNifty50List.txt updated successfully.');
        setShowNiftyModal(false);
      }
    } catch (e: any) {
      setMessage(`Error saving Nifty list: ${e.message}`);
    } finally {
      setSavingNifty(false);
    }
  };

  const handleRunScan = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/scanner/run?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          target_list: targetList,
          custom_symbols: customSymbols,
          limit
        })
      });
      const data = await res.json();
      addRawLog({
        title: `Scan: ${mode} (${targetList})`,
        command: data.command,
        stdout: data.stdout,
        stderr: data.stderr
      });

      const items = data.watchlist?.hits || data.watchlist || [];
      if (Array.isArray(items)) {
        setHits(items);
        setMessage(`Scan complete. Found ${items.length} candidate setup(s).`);
      } else {
        setMessage('Scan executed. Check console logs for output.');
      }
    } catch (e: any) {
      setMessage(`Error running scanner: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicker = (ticker: string) => {
    setPipelineSymbol(ticker);
    onNavigate('pipeline');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Radar className="w-6 h-6 text-primary" />
            <span>Market Scanner & Setup Finder</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Scan thousands of charts for opening-range breakouts, bull flags, and oversold bounces.
          </p>
        </div>

        {/* Nifty 50 List Editor Trigger */}
        <button
          onClick={() => {
            loadNiftyList();
            setShowNiftyModal(true);
          }}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-border text-xs text-slate-200 hover:text-white hover:border-slate-700 transition"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Edit MyNifty50List.txt</span>
        </button>
      </div>

      {/* Control Configuration Bar */}
      <div className="p-6 rounded-xl bg-card border border-border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Scan Strategy</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="daily">Daily Closes (Flag, Reclaim MA20, RSI Bounce)</option>
            <option value="orb">Opening Range Breakouts (ORB 5m / 15m)</option>
          </select>
        </div>

        {/* Target List */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Universe</label>
          <select
            value={targetList}
            onChange={(e) => setTargetList(e.target.value)}
            className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="nifty50">🇮🇳 Nifty 50 Basket (MyNifty50List.txt)</option>
            <option value="custom">Custom Indian Tickers (.NS / .BO)</option>
          </select>
        </div>

        {/* Custom Symbols or Limit */}
        <div>
          {targetList === 'custom' ? (
            <>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Symbols (comma separated)</label>
              <input
                type="text"
                value={customSymbols}
                onChange={(e) => setCustomSymbols(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                placeholder="RELIANCE.NS,TCS.NS,INFY.NS"
              />
            </>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Symbols to Scan</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
                min={5}
                max={500}
              />
            </>
          )}
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleRunScan}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Scanning Charts...' : 'Execute Scan'}</span>
          </button>
        </div>
      </div>

      {/* Message notification */}
      {message && (
        <div className="p-3 rounded-lg bg-slate-900 border border-border flex items-center space-x-2 text-xs text-slate-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Results Table */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            Current Watchlist / Setup Hits ({hits.length})
          </h2>
        </div>

        {hits.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 italic">
            No active setups found yet in user watchlist. Click "Execute Scan" above to run market scanner.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-slate-500">
                  <th className="py-2.5 px-3">Ticker</th>
                  <th className="py-2.5 px-3">Setup Trigger</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Change %</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-slate-300">
                {hits.map((hit, idx) => {
                  const ticker = hit.ticker || hit.symbol || `Item #${idx + 1}`;
                  const setupName = hit.setup || hit.pattern || 'Setup Hit';
                  const price = hit.price || hit.close || '—';
                  const chg = hit.change_pct !== undefined ? `${hit.change_pct > 0 ? '+' : ''}${hit.change_pct}%` : '—';
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3 font-bold text-white text-sm">{ticker}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold text-[11px]">
                          {setupName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-bold">₹{price}</td>
                      <td className={`py-3 px-3 font-semibold ${String(chg).startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {chg}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{hit.volume?.toLocaleString() || '—'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleSelectTicker(ticker)}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-primary text-slate-950 font-bold hover:bg-sky-400 transition"
                        >
                          <span>Analyze in Pipeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Edit MyNifty50List.txt */}
      {showNiftyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Configure MyNifty50List.txt</span>
              </div>
              <button
                onClick={() => setShowNiftyModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Customize the list of constituents scanned during Indian Market sessions. One symbol per line (e.g. <code>RELIANCE.NS</code>).
            </p>

            <textarea
              rows={12}
              value={niftyContent}
              onChange={(e) => setNiftyContent(e.target.value)}
              className="w-full bg-slate-950 border border-border rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary leading-relaxed"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNiftyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNifty}
                disabled={savingNifty}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingNifty ? 'Saving...' : 'Save Watchlist File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
