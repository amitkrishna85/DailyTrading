import React from 'react';
import { Lightbulb, ShieldAlert, TrendingUp, Zap, Target, Brain, Award } from 'lucide-react';

export const TipsPage: React.FC = () => {
  const tips = [
    {
      icon: ShieldAlert,
      title: 'The 1% Golden Rule of Sizing',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      rule: 'Never risk more than 1% of your total account capital on a single setup.',
      description: 'Even top traders suffer 5 to 7 consecutive losses during choppy regimes. By strictly sizing each stop loss to 1% of your equity, a 7-trade drawdown is only ~6.8%, leaving 93% of your capital intact to capture the next runner.'
    },
    {
      icon: Target,
      title: 'Let the Time Machine Save You from "Coin Flips"',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      rule: 'If historical empirical odds show <45% target hit rate, DO NOT trade.',
      description: 'Most day traders lose money by over-trading setups that look visually attractive on a 5-minute chart but have zero empirical edge. If the Time Machine indicates a coin flip, the best decision you can make that day is NO TRADE.'
    },
    {
      icon: Zap,
      title: 'Honor the Daily Circuit Breaker',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      rule: 'If your max daily loss (3%) is hit, close your charts and step away.',
      description: 'Revenge trading after 2 early morning stop-outs accounts for over 80% of blown retail trading accounts. The automated risk gatekeeper blocks all further orders once your daily loss limit is reached. Honor it.'
    },
    {
      icon: TrendingUp,
      title: 'How to Handle Indian Market (NSE) Morning Gaps',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      rule: 'Never chase a stock opening with a >2% overnight gap without consolidation.',
      description: 'On Nifty 50 constituents (like Reliance, HDFC Bank, Infosys), massive morning gap-ups often face immediate profit-taking between 09:15 and 09:30 AM. Wait for the 15-minute Opening Range to establish itself, then only trade when a candle firmly closes above the ORB high.'
    },
    {
      icon: Brain,
      title: 'Never Move Your Stop-Loss Farther Away',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      rule: 'A stop is an empirical invalidation level, not a suggestion.',
      description: 'Moving a stop loss wider during an active trade turns a controlled 1% risk into an emotional 5% or 10% catastrophe. The exit plan calculated in Step 2 of the pipeline is fixed for the duration of the trade.'
    },
    {
      icon: Award,
      title: 'Flat by 15:15 IST -- Intraday MIS Square-Off Rule',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      rule: 'Day trades belong in the day session. Never hold overnight.',
      description: 'Holding an intraday setup overnight exposes you to massive gap risks where your stop-loss cannot protect you. Intraday MIS orders auto-square off by 15:15-15:20 IST. Always exit before the broker executes market orders.'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          <span>Professional Day Trading Tips & Rules</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Master the psychological and mathematical habits separating consistently profitable day traders from the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tips.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div key={idx} className="p-6 rounded-xl bg-card border border-border space-y-3 hover:border-slate-700 transition">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg border ${t.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{t.title}</h3>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-border text-xs font-semibold text-primary">
                "{t.rule}"
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {t.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

