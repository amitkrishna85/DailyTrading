export interface UserConfig {
  budget: number;
  cash_buffer_pct: number;
  max_position_pct: number;
  max_order_usd: number;
  min_order_usd: number;
  max_loss_per_trade_usd: number;
  max_daily_loss_usd: number;
  max_trades_per_day: number;
  max_orders_per_day: number;
  min_reward_risk: number;
  require_stop: boolean;
  no_entries_before: string;
  no_entries_after: string;
  flat_by: string;
  fractional: boolean;
  broker: string;
  paper: boolean;
  blocked: string[];
  allow_options: boolean;
  allow_margin: boolean;
  allow_short: boolean;
  pdt_guard: boolean;
  sec_user_agent: string;
}

export interface MarketStatus {
  india: {
    time_str: string;
    date_str: string;
    status: 'PRE-MARKET' | 'OPEN' | 'POST-MARKET' | 'CLOSED';
    timezone: string;
    currency?: string;
    currency_symbol?: string;
    exchange?: string;
  };
}

export interface ScanHit {
  ticker: string;
  name?: string;
  setup?: string;
  price?: number;
  change_pct?: number;
  volume?: number;
  signal?: string;
  [key: string]: any;
}

export interface NewsItem {
  time?: string;
  headline?: string;
  ticker?: string;
  source?: string;
  tag?: string;
  url?: string;
  [key: string]: any;
}

export interface TradePlan {
  symbol: string;
  side: string;
  date?: string;
  time?: string;
  entry: number;
  stop: number;
  target: number;
  risk_per_share: number;
  reward_per_share: number;
  reward_risk: number;
  flat_by?: string;
  setup?: string;
  [key: string]: any;
}

export interface TimeMachineResult {
  symbol?: string;
  target_pct?: number;
  stop_pct?: number;
  open_pct?: number;
  history_hits?: number;
  history_target_hit?: number;
  history_stop_hit?: number;
  verdict?: string;
  [key: string]: any;
}

export interface SizedOrder {
  symbol: string;
  qty: number;
  side: string;
  type: string;
  time_in_force: string;
  limit_price?: number;
  stop_loss?: { stop_price: number };
  take_profit?: { limit_price: number };
  notional?: number;
  max_loss?: number;
  [key: string]: any;
}

export interface RiskRuleVerdict {
  rule: string;
  verdict: 'PASS' | 'BLOCK';
  reason?: string;
  actual?: any;
  threshold?: any;
}

export interface AlertRule {
  id?: string;
  symbol: string;
  above?: number;
  below?: number;
  stop?: number;
  target?: number;
  at?: string;
  label?: string;
  note?: string;
  [key: string]: any;
}
