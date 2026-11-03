import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { InteractiveCandlestickChart } from '../components/charts/InteractiveCandlestickChart';
import {
  GitBranch,
  Timer,
  Target,
  Sparkles,
  Calculator,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const { pipelineSymbol, setPipelineSymbol, activeUser, config, addRawLog } = useUser();

  // Wizard Step (1: Entry, 2: Exit, 3: Time Machine, 4: Budget, 5: Risk, 6: Broker)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Entry State
  const [setupType, setSetupType] = useState<string>('orb');
  const [entryResult, setEntryResult] = useState<any>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [watchLogs, setWatchLogs] = useState<string[]>([]);

  // Step 2: Exit Plan State
  const [entryPrice, setEntryPrice] = useState<number>(2980.50);
  const [stopMethod, setStopMethod] = useState<string>('or-mid');
  const [targetMultiple, setTargetMultiple] = useState<string>('2R');
  const [planResult, setPlanResult] = useState<any>(null);

  // Step 3: Time Machine State
  const [replays, setReplays] = useState<number>(1000);
  const [simResult, setSimResult] = useState<any>(null);

  // Step 4: Budget Sizer State
  const [orderResult, setOrderResult] = useState<any>(null);

  // Step 5: Risk Gatekeeper State
  const [verdictResult, setVerdictResult] = useState<any>(null);
  const [isRiskPass, setIsRiskPass] = useState<boolean>(false);

  // Step 6: Broker State & Modal
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [executeSuccess, setExecuteSuccess] = useState<boolean>(false);

  // Load existing user plan on mount
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await fetch(`/api/pipeline/status?user=${encodeURIComponent(activeUser)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.plan) {
            setPlanResult(data.plan);
            if (data.plan.symbol) setPipelineSymbol(data.plan.symbol);
            if (data.plan.entry) setEntryPrice(data.plan.entry);
          }
          if (data.timemachine) setSimResult(data.timemachine);
          if (data.orders) setOrderResult(data.orders);
          if (data.verdicts) {
            setVerdictResult(data.verdicts);
            setIsRiskPass(data.verdicts.verdict === 'PASS');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchExisting();
  }, [activeUser]);

  // --- Step 1 Action: Entry Check ---
  const handleCheckEntry = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/entry/check?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: pipelineSymbol, setup: setupType })
      });
      const data = await res.json();
      addRawLog({ title: `Entry Check: ${pipelineSymbol}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      setEntryResult(data.data);
      if (data.data?.entry || data.data?.price) {
        setEntryPrice(Number(data.data.entry || data.data.price));
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 1 Action: Live Watcher via SSE ---
  const handleStartWatch = () => {
    setIsWatching(true);
    setWatchLogs([]);
    const evtSource = new EventSource(`/api/pipeline/entry/watch?symbol=${encodeURIComponent(pipelineSymbol)}&setup=${encodeURIComponent(setupType)}&user=${encodeURIComponent(activeUser)}`);
    evtSource.onmessage = (e) => {
      const parsed = JSON.parse(e.data);
      setWatchLogs(prev => [`[${new Date(parsed.timestamp).toLocaleTimeString()}] Iteration ${parsed.iteration}: ${JSON.stringify(parsed.result)}`, ...prev.slice(0, 15)]);
      if (parsed.stdout?.includes('TRIGGERED') || parsed.stdout?.includes('EXPIRED')) {
        evtSource.close();
        setIsWatching(false);
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
      setIsWatching(false);
    };
  };

  // --- Step 2 Action: Exit Plan ---
  const handleCreatePlan = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/exit/plan?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: pipelineSymbol,
          entry_price: entryPrice,
          stop: stopMethod,
          target: targetMultiple
        })
      });
      const data = await res.json();
      addRawLog({ title: `Exit Plan: ${pipelineSymbol}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      setPlanResult(data.plan);
      setCurrentStep(3); // Advance to Time Machine
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 3 Action: Time Machine ---
  const handleRunTimeMachine = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/timemachine/run?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replays })
      });
      const data = await res.json();
      addRawLog({ title: `Time Machine: ${pipelineSymbol}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      setSimResult(data.simulation);
      setCurrentStep(4); // Advance to Budget Sizer
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 4 Action: Budget Sizer ---
  const handleSizeBudget = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/budget/size?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      addRawLog({ title: `Budget Sizer: ${pipelineSymbol}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      setOrderResult(data.orders);
      setCurrentStep(5); // Advance to Risk Check
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 5 Action: Risk Check ---
  const handleCheckRisk = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/risk/check?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST'
      });
      const data = await res.json();
      addRawLog({ title: `Risk Check: ${pipelineSymbol}`, command: data.command, stdout: data.stdout, stderr: data.stderr });
      setVerdictResult(data.verdicts);
      setIsRiskPass(data.is_pass);
      if (data.is_pass) {
        // Fetch ticket readiness
        const tres = await fetch(`/api/pipeline/broker/ticket?user=${encodeURIComponent(activeUser)}`, { method: 'POST' });
        if (tres.ok) {
          const tdata = await tres.json();
          setTicketResult(tdata.ticket);
        }
        setCurrentStep(6); // Advance to Broker Ticket
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 6 Action: Broker Execution ---
  const handleConfirmOrder = async () => {
    if (confirmInput.trim().toUpperCase() !== 'YES') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/pipeline/broker/confirm?user=${encodeURIComponent(activeUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_token: 'YES' })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Execution failed');
      }
      setExecuteSuccess(true);
      setShowConfirmModal(false);
      setConfirmInput('');
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Entry Timer', desc: 'Timing & Trigger' },
    { num: 2, title: 'Exit Planner', desc: 'Stop & Target' },
    { num: 3, title: 'Time Machine', desc: 'Monte Carlo Replay' },
    { num: 4, title: 'Budget Sizer', desc: 'Position Risk' },
    { num: 5, title: 'Risk Check', desc: 'Safety Gatekeeper' },
    { num: 6, title: 'Broker Ticket', desc: 'Order Execution' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-primary" />
            <span>Disciplined Trade Pipeline</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze, verify empirical odds, size strictly to your budget, and pass all risk checks before execution.
          </p>
        </div>

        {/* Symbol Quick Switcher */}
        <div className="flex items-center space-x-2 bg-card border border-border px-3 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Target Ticker:</span>
          <input
            type="text"
            value={pipelineSymbol}
            onChange={(e) => setPipelineSymbol(e.target.value.toUpperCase())}
            className="bg-slate-950 border border-border rounded px-2 py-1 text-xs font-mono font-bold text-primary w-28 uppercase focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Wizard Progress Steps Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {steps.map((s) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-3 rounded-xl border text-left transition ${
                isActive
                  ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10'
                  : isDone
                  ? 'bg-card border-slate-700/60 text-slate-300'
                  : 'bg-card/40 border-border/40 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-primary text-slate-950' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  0{s.num}
                </span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{s.title}</div>
              <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-center space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Technical Chart Preview */}
      <InteractiveCandlestickChart
        symbol={pipelineSymbol}
        entryPrice={entryPrice}
        stopPrice={planResult?.stop}
        targetPrice={planResult?.target}
        height={320}
      />

      {/* --- STEP 1: ENTRY TIMER --- */}
      {currentStep === 1 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step 1: Entry Timing ({pipelineSymbol})</h2>
              <p className="text-xs text-slate-400">Watches the setup bar-by-bar to detect the exact trigger moment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Setup Strategy</label>
              <select
                value={setupType}
                onChange={(e) => setSetupType(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="orb">Opening Range Breakout (ORB 15m)</option>
                <option value="breakout_20d">20-Day Daily Breakout</option>
                <option value="bull_flag">Bull Flag Consolidation</option>
                <option value="reclaim_ma20">Reclaim 20-Day MA</option>
                <option value="oversold_bounce">RSI Oversold Bounce</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleCheckEntry}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
              >
                {loading ? 'Checking...' : 'Check Status Once'}
              </button>
              <button
                onClick={handleStartWatch}
                disabled={isWatching}
                className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${
                  isWatching ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {isWatching ? 'Watching Live...' : 'Watch Bar-by-Bar (SSE)'}
              </button>
            </div>
          </div>

          {/* Entry Check Result */}
          {entryResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-border font-mono text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Trigger Status:</span>
                <span className="font-bold text-emerald-400 text-sm">{entryResult.status || 'CHECKED'}</span>
              </div>
              <pre className="text-slate-400 text-[11px] whitespace-pre-wrap">{JSON.stringify(entryResult, null, 2)}</pre>
            </div>
          )}

          {/* SSE Live Log */}
          {watchLogs.length > 0 && (
            <div className="p-4 rounded-lg bg-slate-950 border border-border space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Live Bar Streaming Updates</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-400">
                {watchLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
            >
              <span>Next: Set Stop & Target</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: EXIT PLANNER --- */}
      {currentStep === 2 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step 2: Exit Plan ({pipelineSymbol})</h2>
              <p className="text-xs text-slate-400">Lock in stop-loss and take-profit targets before entering.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Planned Entry Price (₹)</label>
              <input
                type="number"
                step="0.05"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Stop-Loss Placement</label>
              <select
                value={stopMethod}
                onChange={(e) => setStopMethod(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="or-mid">Range Midpoint (or-mid)</option>
                <option value="or-low">Range Low (or-low)</option>
                <option value="pct:1.0">1.0% Below Entry</option>
                <option value="pct:2.0">2.0% Below Entry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Multiple</label>
              <select
                value={targetMultiple}
                onChange={(e) => setTargetMultiple(e.target.value)}
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary"
              >
                <option value="1R">1R (1.0x Risk)</option>
                <option value="1.5R">1.5R (1.5x Risk)</option>
                <option value="2R">2R (2.0x Risk - Default)</option>
                <option value="3R">3R (3.0x Risk)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Back to Entry
            </button>
            <button
              onClick={handleCreatePlan}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
            >
              <span>{loading ? 'Calculating Plan...' : 'Save Plan & Run Odds'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: TIME MACHINE --- */}
      {currentStep === 3 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step 3: The Time Machine (Empirical Odds)</h2>
              <p className="text-xs text-slate-400">
                Replays the session 10,000 times from recent intraday candles plus historical setup days before risking capital.
              </p>
            </div>
          </div>

          {planResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Symbol:</span> <span className="text-white font-bold">{planResult.symbol}</span>
              </div>
              <div>
                <span className="text-slate-500">Entry:</span> <span className="text-sky-400 font-bold">₹{planResult.entry}</span>
              </div>
              <div>
                <span className="text-slate-500">Stop:</span> <span className="text-rose-400 font-bold">₹{planResult.stop}</span>
              </div>
              <div>
                <span className="text-slate-500">Target:</span> <span className="text-emerald-400 font-bold">₹{planResult.target}</span>
              </div>
            </div>
          )}

          {/* Time Machine Results Gauge */}
          {simResult && (
            <div className="p-6 rounded-xl bg-slate-950 border border-border space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Monte Carlo Simulation Verdict:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {simResult.verdict || 'Empirical Odds Calculated'}
                </span>
              </div>

              {/* Odds Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">Target First: {simResult.target_pct || 42}%</span>
                  <span className="text-slate-400">Open at Close: {simResult.open_pct || 30}%</span>
                  <span className="text-rose-400 font-bold">Stop First: {simResult.stop_pct || 28}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
                  <div style={{ width: `${simResult.target_pct || 42}%` }} className="bg-emerald-500" />
                  <div style={{ width: `${simResult.open_pct || 30}%` }} className="bg-slate-600" />
                  <div style={{ width: `${simResult.stop_pct || 28}%` }} className="bg-rose-500" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Back to Exit Plan
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleRunTimeMachine}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition"
              >
                {loading ? 'Replaying 10,000 Bars...' : 'Run Simulation'}
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
              >
                <span>Next: Size Budget</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 4: BUDGET SIZER --- */}
      {currentStep === 4 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step 4: Position Sizing (Risk Alignment)</h2>
              <p className="text-xs text-slate-400">
                Calculates maximum whole shares so that stop-out loss never exceeds ₹{config?.max_loss_per_trade_usd}.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-slate-950 border border-border space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Account Budget:</span>
                <div className="text-white font-bold text-sm">₹{config?.budget?.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-slate-500">Max Loss Allowed:</span>
                <div className="text-rose-400 font-bold text-sm">₹{config?.max_loss_per_trade_usd}</div>
              </div>
              <div>
                <span className="text-slate-500">Max Position Cap:</span>
                <div className="text-slate-200 font-bold text-sm">{config?.max_position_pct}%</div>
              </div>
              <div>
                <span className="text-slate-500">Cash Buffer:</span>
                <div className="text-slate-200 font-bold text-sm">{config?.cash_buffer_pct}%</div>
              </div>
            </div>

            {orderResult && (
              <div className="pt-4 border-t border-border/60">
                <div className="text-xs font-semibold text-primary mb-2">Calculated Bracket Order:</div>
                <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(orderResult, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Back to Time Machine
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleSizeBudget}
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition"
              >
                {loading ? 'Calculating...' : 'Calculate Share Quantity'}
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition"
              >
                <span>Next: Risk Gatekeeper</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 5: RISK GATEKEEPER --- */}
      {currentStep === 5 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Step 5: Automated Risk Gatekeeper</h2>
                <p className="text-xs text-slate-400">Every order must strictly satisfy 8 safety rules before the broker ticket is unlocked.</p>
              </div>
            </div>
            <button
              onClick={handleCheckRisk}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold text-sm hover:bg-rose-500 transition"
            >
              {loading ? 'Verifying...' : 'Evaluate 8 Risk Rules'}
            </button>
          </div>

          {verdictResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isRiskPass ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center space-x-3">
                  {isRiskPass ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-rose-400" />}
                  <div>
                    <div className="font-bold text-sm">Overall Verdict: {isRiskPass ? 'PASS — ALL RULES SATISFIED' : 'BLOCK — SAFETY RULE VIOLATION'}</div>
                    <div className="text-xs opacity-80">{isRiskPass ? 'You are authorized to proceed to order ticket confirmation.' : 'Order cannot be placed until parameters are within risk limits.'}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-border">
                <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(verdictResult, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-lg bg-slate-950 text-xs text-slate-500 italic">
              Click "Evaluate 8 Risk Rules" above to test this trade against your limits.
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Back to Budget Sizer
            </button>
            <button
              onClick={() => setCurrentStep(6)}
              disabled={!isRiskPass}
              className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-primary text-slate-950 font-bold text-sm hover:bg-sky-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Unlock Order Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 6: BROKER TICKET & TWO-FACTOR CONFIRMATION --- */}
      {currentStep === 6 && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Step 6: Broker Ticket & Explicit Approval</h2>
              <p className="text-xs text-slate-400">
                Review the plain English ticket. No trade goes through without explicit user consent.
              </p>
            </div>
          </div>

          {executeSuccess ? (
            <div className="p-8 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Order Successfully Dispatched!</h3>
              <p className="text-xs text-slate-300">
                Your bracket order was logged to <code className="font-mono bg-slate-900 px-1 py-0.5 rounded">trade_log.jsonl</code> in paper trading mode.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950 border border-border space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Ticket:</div>
              <div className="p-4 rounded-lg bg-slate-900 border border-border font-mono text-sm text-slate-100">
                {ticketResult ? JSON.stringify(ticketResult, null, 2) : 'BUY RELIANCE.NS Bracket Order: Market Entry, Stop-Loss and Take-Profit Defined.'}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Review & Send Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Two-Factor "YES" Confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Explicit Execution Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nothing in this suite places an order automatically. To confirm dispatch of this order for trader profile <strong className="text-primary">{activeUser}</strong>, please type <span className="font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">YES</span> below:
            </p>
            <input
              type="text"
              placeholder="Type YES to confirm"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full bg-slate-950 border border-border px-3 py-2 rounded-lg text-sm text-slate-100 font-mono text-center focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={confirmInput.trim().toUpperCase() !== 'YES' || loading}
                className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Confirm & Send Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
