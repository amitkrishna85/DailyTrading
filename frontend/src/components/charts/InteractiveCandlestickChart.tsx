import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { RefreshCw, BarChart2 } from 'lucide-react';

interface InteractiveCandlestickChartProps {
  symbol: string;
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  height?: number;
}

export const InteractiveCandlestickChart: React.FC<InteractiveCandlestickChartProps> = ({
  symbol,
  entryPrice,
  stopPrice,
  targetPrice,
  height = 360
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [range, setRange] = useState<string>('1d');
  const [interval, setInterval] = useState<string>('5m');
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/charts/bars?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`);
      if (res.ok) {
        const json = await res.json();
        const bars = json.bars || [];
        if (candlestickSeriesRef.current && bars.length > 0) {
          candlestickSeriesRef.current.setData(bars);
          setLastPrice(bars[bars.length - 1].close);
          chartRef.current?.timeScale().fitContent();
        }
      }
    } catch (e) {
      console.error('Error loading chart bars:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Lightweight Chart
    const chart = createChart(chartContainerRef.current, {
      height,
      layout: {
        background: { color: '#090d16' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#38bdf8', width: 1, style: 2 },
        horzLine: { color: '#38bdf8', width: 1, style: 2 },
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    fetchChartData();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, range, interval]);

  // Apply Price Lines for Entry, Stop, and Target
  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    const lines: any[] = [];

    if (entryPrice && entryPrice > 0) {
      const el = series.createPriceLine({
        price: entryPrice,
        color: '#38bdf8',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'ENTRY',
      });
      lines.push(el);
    }

    if (stopPrice && stopPrice > 0) {
      const sl = series.createPriceLine({
        price: stopPrice,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'STOP LOSS',
      });
      lines.push(sl);
    }

    if (targetPrice && targetPrice > 0) {
      const tl = series.createPriceLine({
        price: targetPrice,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'TARGET (TP)',
      });
      lines.push(tl);
    }

    return () => {
      lines.forEach(l => {
        try {
          series.removePriceLine(l);
        } catch (_) {}
      });
    };
  }, [entryPrice, stopPrice, targetPrice, loading]);

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      {/* Top Chart Header / Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm font-mono">{symbol}</span>
              {lastPrice && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₹{lastPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Interactive Technical Candlesticks</span>
          </div>
        </div>

        {/* Interval & Range Selectors */}
        <div className="flex items-center space-x-2">
          {/* Timeframe Interval */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-border rounded-lg p-0.5 text-xs">
            {['1m', '5m', '15m', '1d'].map(i => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition ${
                  interval === i ? 'bg-primary text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <button
            onClick={fetchChartData}
            disabled={loading}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
            title="Reload Chart Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full overflow-hidden rounded-lg border border-border/60">
        <div ref={chartContainerRef} className="w-full" style={{ height }} />
        {loading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center text-xs text-primary font-mono space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Streaming Bars...</span>
          </div>
        )}
      </div>

      {/* Price Legend */}
      <div className="flex items-center space-x-4 text-[11px] font-mono pt-1 text-slate-400">
        {entryPrice && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Entry: <strong className="text-white">₹{entryPrice}</strong></span>
          </div>
        )}
        {stopPrice && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Stop: <strong className="text-rose-400">₹{stopPrice}</strong></span>
          </div>
        )}
        {targetPrice && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Target: <strong className="text-emerald-400">₹{targetPrice}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

