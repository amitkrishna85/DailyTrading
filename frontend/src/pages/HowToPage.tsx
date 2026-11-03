import React, { useState } from 'react';
import {
  BookOpen,
  GitBranch,
  ShieldAlert,
  Radar,
  Timer,
  Target,
  Sparkles,
  Calculator,
  Send,
  BellRing,
  LineChart,
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const HowToPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('workflow');

  const skillsList = [
    { name: 'trader-scanner', script: 'scan.py', role: 'Scans charts for Opening Range Breakouts, Bull Flags, and RSI Oversold bounces.' },
    { name: 'trader-news', script: 'news.py', role: 'Tracks market-moving catalysts (company financial releases, regulatory notices, breaking headlines).' },
    { name: 'trader-entry', script: 'entry.py', role: 'Watches a setup bar-by-bar and fires a trigger signal the exact moment of a breakout.' },
    { name: 'trader-exit', script: 'exit.py', role: 'Calculates the stop-loss and take-profit target BEFORE entering, locking in Reward:Risk.' },
    { name: 'trader-timemachine', script: 'timemachine.py', role: 'Simulates 10,000 sessions from recent bars and past setup matches to reveal empirical odds.' },
    { name: 'trader-budget', script: 'size.py', role: 'Calculates exact whole-share sizing so potential stop-out loss never exceeds your rupee limit.' },
    { name: 'trader-risk', script: 'check.py', role: 'The safety gatekeeper. Evaluates 8 strict rules (daily loss, max drawdown, trading window).' },
    { name: 'trader-broker', script: 'ticket.py', role: 'Drafts plain-English bracket orders. Requires green PASS from Risk and explicit YES.' },
    { name: 'trader-alerts', script: 'alerts.py', role: 'Monitors prices during active hours and alerts when stops, targets, or 15:15 IST hits.' },
    { name: 'trader-analyst', script: 'facts.py', role: 'Reads quarterly financial reports, revenue growth, and margins across fiscal periods.' },
    { name: 'trader-pelosi', script: 'ptr.py', role: 'Monitors public transaction disclosures and insider trading activity reports.' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <span>How To Use DayTrader AI -- Official Trader Guide</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          A systematic, risk-first operating manual for analyzing setups and placing disciplined trades on Indian Markets (NSE/BSE).
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {[
          { id: 'workflow', label: '1. Standard 8-Step Workflow' },
          { id: 'skills', label: '2. The 11 Skills Explained' },
          { id: 'timemachine', label: '3. Reading Time Machine Odds' },
          { id: 'risk', label: '4. Risk Rules & Gatekeeper' },
          { id: 'markets', label: '5. Indian Market Sessions (NSE/BSE)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeSection === tab.id
                ? 'bg-primary text-slate-950 shadow-sm'
                : 'bg-card border border-border text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- SECTION 1: WORKFLOW --- */}
      {activeSection === 'workflow' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <span>The Standard Day Trading Lifecycle</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every day trade follows an unbendable sequential pipeline. Never skip a step:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-border overflow-x-auto">
              scanner ➔ news ➔ entry ➔ exit ➔ timemachine ➔ budget ➔ risk ➔ broker
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">1</span>
                  <span>Find the Setup (Scanner)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Start in the <strong>Scanner</strong> tab before market open or after the first 15-minute bar. Select <em>ORB (Opening Range Breakout)</em> or <em>Daily Setups</em> on your target list (e.g. Nifty 50 or Custom Watchlist).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">2</span>
                  <span>Check for News Catalysts (News)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Before trading any setup, check the <strong>News</strong> feed. Is there a quarterly earnings release today? A SEBI or regulatory announcement? Knowing the catalyst prevents trading blindly into high-volatility events.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">3</span>
                  <span>Time the Trigger (Entry Timer)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open the <strong>Decision Pipeline</strong>. Click "Check Status Once" or start the real-time SSE live watcher. The system waits until the 5-minute candle officially closes above the breakout level.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">4</span>
                  <span>Set Your Stop and Target (Exit Planner)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Choose your stop method (e.g., <em>Range Midpoint</em> or <em>Range Low</em>) and target multiple (<em>2R default</em>). The tool locks in your planned exit points before any capital is risked.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">5</span>
                  <span>Replay Odds (The Time Machine)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Run the Monte Carlo simulation. It replays 10,000 sessions using the stock's recent intraday bars. If the Target Hit % is below 40%, it is a coin flip -- pass on the trade!
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">6</span>
                  <span>Size to Risk (Budget Sizer)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The budget manager computes the exact share quantity so that even if the stop fills, your rupee loss will never exceed your <code>max_loss_per_trade</code> setting.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">7</span>
                  <span>Pass the 8 Risk Checks (Risk Gatekeeper)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The risk tool automatically tests your order against 8 critical rules (daily drawdown, trades per day, trading window). You must receive a green <strong>PASS</strong> to proceed.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-border space-y-2">
                <div className="font-bold text-white text-xs flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[10px]">8</span>
                  <span>Review & Confirm (Broker Ticket)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Review the plain-English order ticket. Type <strong>YES</strong> to execute. The system creates a bracket order in paper trading mode and logs it to <code>trade_log.jsonl</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 2: SKILLS --- */}
      {activeSection === 'skills' && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <h2 className="text-base font-semibold text-white">The 11 Python Skills Powering the Application</h2>
            <p className="text-xs text-slate-300">
              Each module is completely self-contained in standard Python, requiring zero external paid APIs:
            </p>

            <div className="divide-y divide-border/60">
              {skillsList.map((s, idx) => (
                <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-primary">{s.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-border">
                      {s.script}
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs md:max-w-xl">{s.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 3: TIME MACHINE --- */}
      {activeSection === 'timemachine' && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Understanding Empirical Odds & The Time Machine</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The Time Machine is not a crystal ball; it is a sanity check. It samples thousands of 5-minute candles from the stock's actual last 60 days of history at that exact time of day.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-900 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="font-bold text-emerald-400">Target Hit First (&gt; 45%)</div>
              <p className="text-[11px] text-slate-300">
                A strong statistical edge. Historical patterns indicate favorable momentum in the direction of your breakout.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-amber-500/30 text-xs space-y-1.5">
              <div className="font-bold text-amber-400">Target ~ Stop (~ 30% each)</div>
              <p className="text-[11px] text-slate-300">
                The verdict will report: <strong>"Close to a coin flip"</strong>. Why risk capital when the historical odds are 50/50? Passing on coin flips is what keeps traders profitable.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-rose-500/30 text-xs space-y-1.5">
              <div className="font-bold text-rose-400">Stop Hit First (&gt; 35%)</div>
              <p className="text-[11px] text-slate-300">
                High chop or negative expectancy. Immediately reject the trade setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 4: RISK RULES --- */}
      {activeSection === 'risk' && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>The 8 Risk Gatekeeper Rules</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every trade MUST satisfy all 8 rules. If a single rule fails, the order cannot be placed:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">1. Max Loss / Trade:</strong> Stop-out loss cannot exceed configured rupee limit.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">2. Daily Circuit Breaker:</strong> Daily cumulative losses cannot exceed max daily loss.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">3. Trading Window:</strong> No entries before <code>no_entries_before</code> or after <code>no_entries_after</code>.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">4. Flat by Close:</strong> Every trade must have an exit target before <code>flat_by</code> (15:15 IST).
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">5. Max Position Cap:</strong> Gross position size cannot exceed % of account budget.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">6. Cash Buffer:</strong> Sizing must preserve your required cash buffer reserve.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">7. Reward to Risk:</strong> Planned R:R ratio must meet or exceed <code>min_reward_risk</code>.
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-border">
              <strong className="text-white">8. Stop Required:</strong> Bracket orders without a stop price are strictly banned.
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 5: MARKETS --- */}
      {activeSection === 'markets' && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-base font-semibold text-white">Indian Market Trading Sessions & Execution Rules (NSE/BSE)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The platform is engineered specifically for Indian equity trading with exchange session timings:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-2 text-xs">
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>🇮🇳 Regular Exchange Sessions (IST)</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li>• Pre-Market Session: <strong>09:00 - 09:15 IST</strong> (Order matching & opening price discovery)</li>
                <li>• Market Open / Regular Trading: <strong>09:15 - 15:30 IST</strong></li>
                <li>• Opening Range Formation: <strong>09:15 - 09:30 IST</strong> (First 15-minute bar establishment)</li>
                <li>• Peak Liquidity Window: <strong>09:30 - 11:30 IST</strong> and <strong>14:00 - 15:15 IST</strong></li>
                <li>• Post-Close Session: <strong>15:40 - 16:00 IST</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-border space-y-2 text-xs">
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>🛡️ Intraday Rules & Basket Setup</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li>• Force Flat-by Time: <strong>15:15 IST</strong> (preempts broker MIS auto-square-off charges)</li>
                <li>• Symbol Tickers: <code>RELIANCE.NS</code>, <code>TCS.NS</code>, <code>HDFCBANK.NS</code>, <code>INFY.NS</code></li>
                <li>• Curated Basket: <code>MyNifty50List.txt</code> (directly editable in UI)</li>
                <li>• Circuit Limits: 5%, 10%, 20% price bands defined by exchange rules</li>
                <li>• Paper Trading Mode: Zero real risk testing before placing live orders</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
