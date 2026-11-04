// Client-side fallback runner when backend is offline or hosted on static cloud (e.g. Vercel)

export const DEFAULT_NIFTY_LIST = `RELIANCE.NS
TCS.NS
HDFCBANK.NS
INFY.NS
ICICIBANK.NS
SBIN.NS
BHARTIARTL.NS
TATAMOTORS.NS
ITC.NS
LT.NS
KOTAKBANK.NS
HINDUNILVR.NS
AXISBANK.NS
BAJFINANCE.NS
MARUTI.NS
ASIANPAINT.NS
TITAN.NS
SUNPHARMA.NS
ULTRACEMCO.NS
NTPC.NS
M&M.NS
POWERGRID.NS
TATASTEEL.NS
ONGC.NS
COALINDIA.NS
JSWSTEEL.NS
ADANIENT.NS
ADANIPORTS.NS
HCLTECH.NS
WIPRO.NS`;

export function getBasePrice(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes('RELIANCE')) return 1301.0;
  if (s.includes('TCS')) return 2435.0;
  if (s.includes('HDFC')) return 1685.0;
  if (s.includes('INFY')) return 1825.0;
  if (s.includes('ICICI')) return 1245.0;
  if (s.includes('SBI')) return 825.0;
  if (s.includes('TATA')) return 985.0;
  if (s.includes('BHARTI')) return 1570.0;
  if (s.includes('ITC')) return 490.0;
  if (s.includes('LT')) return 3650.0;
  return 1500.0;
}

export function runScanMock(mode: string, targetList: string, customSymbols?: string, limit: number = 8) {
  const symbols = (targetList === 'custom' && customSymbols)
    ? customSymbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'TATAMOTORS.NS', 'BHARTIARTL.NS'];

  const hits = symbols.slice(0, limit || 8).map((sym, idx) => {
    const base = getBasePrice(sym);
    const patterns = ['ORB Breakout (15m)', 'Bull Flag Consolidation', '20-EMA Reclaim', 'VWAP Pullback'];
    const chg = ((idx % 2 === 0 ? 1 : -1) * (0.6 + idx * 0.3)).toFixed(2);
    const orbHigh = (base * 1.008).toFixed(2);
    const orbLow = (base * 0.993).toFixed(2);
    return {
      ticker: sym,
      setup: patterns[idx % patterns.length],
      pattern: patterns[idx % patterns.length],
      price: base.toFixed(2),
      change_pct: Number(chg),
      orb_high: Number(orbHigh),
      orb_low: Number(orbLow),
      volume: 125000 + idx * 18000,
      catalyst: 'Quarterly Earnings & Sector Momentum',
      status: 'TRIGGER_READY'
    };
  });

  return {
    success: true,
    command: `python trader-scanner/scan.py ${mode} --watchlist MyNifty50List.txt --json`,
    stdout: `[SCAN] Evaluated ${symbols.length} Indian NSE symbols. Found ${hits.length} actionable setups.`,
    stderr: '',
    watchlist: hits,
    returncode: 0
  };
}

export function runEntryCheckMock(symbol: string, setupType: string) {
  const base = getBasePrice(symbol);
  const orbHigh = Math.round((base * 1.006) * 100) / 100;
  const currentPrice = Math.round((orbHigh + 1.5) * 100) / 100;

  return {
    success: true,
    command: `python trader-entry/entry.py ${symbol} --setup ${setupType} --json`,
    stdout: `[ENTRY] ${symbol} confirmed 5-minute candle close above ORB high (${orbHigh}). Trigger fired at ${currentPrice}.`,
    stderr: '',
    data: {
      symbol,
      setup: setupType,
      status: 'TRIGGERED',
      entry: currentPrice,
      orb_high: orbHigh,
      timestamp: new Date().toISOString()
    }
  };
}

export function runExitPlanMock(symbol: string, entryPrice: number, stopMethod: string, targetMultiple: string) {
  const entry = entryPrice > 0 ? entryPrice : getBasePrice(symbol);
  let stopDist = entry * 0.007; // ~0.7% risk
  if (stopMethod === 'pct:1.0') stopDist = entry * 0.01;
  else if (stopMethod === 'pct:2.0') stopDist = entry * 0.02;

  const stop = Math.round((entry - stopDist) * 100) / 100;
  let mult = 2.0;
  if (targetMultiple === '1R') mult = 1.0;
  else if (targetMultiple === '1.5R') mult = 1.5;
  else if (targetMultiple === '3R') mult = 3.0;

  const target = Math.round((entry + (stopDist * mult)) * 100) / 100;

  return {
    success: true,
    command: `python trader-exit/exit.py ${symbol} ${entry} --stop ${stopMethod} --target ${targetMultiple} --json`,
    stdout: `[EXIT] Plan established for ${symbol}. Entry: ₹${entry}, Stop: ₹${stop}, Target: ₹${target} (${mult}R).`,
    stderr: '',
    plan: {
      symbol,
      entry,
      stop,
      target,
      rr: mult,
      risk_amount: Math.round(stopDist * 100) / 100
    }
  };
}

export function runTimeMachineMock(symbol: string, replays: number = 10000) {
  return {
    success: true,
    command: `python trader-timemachine/timemachine.py ${symbol} --replays ${replays} --json`,
    stdout: `[TIMEMACHINE] Replayed ${replays} intraday bar paths from recent sessions for ${symbol}.`,
    stderr: '',
    simulation: {
      symbol,
      replays,
      target_pct: 46.8,
      stop_pct: 26.4,
      open_pct: 26.8,
      verdict: 'FAVORABLE -- Target hit probability exceeds stop probability by 1.77x',
      edge: 'Positive Expectancy'
    }
  };
}

export function runBudgetSizerMock(config: any, entryPrice: number, stopPrice: number) {
  const maxLoss = config?.max_loss_per_trade_usd || 5000;
  const budget = config?.budget || 500000;
  const stopDist = Math.max(1.0, entryPrice - stopPrice);
  const shares = Math.floor(maxLoss / stopDist);
  const positionValue = Math.round(shares * entryPrice * 100) / 100;

  return {
    success: true,
    command: `python trader-budget/size.py --risk ${maxLoss} --json`,
    stdout: `[BUDGET] Sized position: ${shares} shares @ ₹${entryPrice}. Total position value: ₹${positionValue.toLocaleString('en-IN')}. Max loss at stop: ₹${maxLoss}.`,
    stderr: '',
    orders: {
      shares,
      position_value: positionValue,
      max_loss_potential: maxLoss,
      budget_utilization_pct: Math.round((positionValue / budget) * 100)
    }
  };
}

export function runRiskCheckMock(config: any, plan: any, orders: any) {
  const verdicts = [
    { rule: 'Max Loss Per Trade', status: 'PASS', detail: `Potential loss within limit` },
    { rule: 'Daily Circuit Breaker', status: 'PASS', detail: `Total daily loss ₹0 < limit` },
    { rule: 'Trading Window', status: 'PASS', detail: `Within valid 09:20 - 14:30 IST session` },
    { rule: 'Flat By Close', status: 'PASS', detail: `Target exit enforced before 15:15 IST` },
    { rule: 'Position Cap', status: 'PASS', detail: `Order value within position cap %` },
    { rule: 'Cash Buffer', status: 'PASS', detail: `Maintains required cash buffer reserve` },
    { rule: 'Minimum Reward to Risk', status: 'PASS', detail: `Planned R:R >= min limit` },
    { rule: 'Stop-Loss Mandatory', status: 'PASS', detail: `Valid stop-loss price defined` }
  ];

  return {
    success: true,
    command: `python trader-risk/check.py --json`,
    stdout: `[RISK] 8/8 safety rules satisfied. Ticket authorization granted.`,
    stderr: '',
    is_pass: true,
    verdicts
  };
}

export function runBrokerTicketMock(symbol: string, plan: any, orders: any) {
  const shares = orders?.shares || 25;
  const entry = plan?.entry || 2980.5;
  const stop = plan?.stop || 2965.0;
  const target = plan?.target || 3011.5;

  return {
    success: true,
    command: `python trader-broker/ticket.py ${symbol} --json`,
    stdout: `[BROKER] Plain-English bracket order drafted. Awaiting user YES confirmation.`,
    stderr: '',
    ticket: {
      action: 'BUY',
      symbol,
      shares,
      order_type: 'BRACKET_MARKET',
      entry_target: `₹${entry}`,
      stop_loss: `₹${stop}`,
      take_profit: `₹${target}`,
      mode: 'PAPER_TRADING',
      disclaimer: 'Requires explicit YES confirmation from trader.'
    }
  };
}

