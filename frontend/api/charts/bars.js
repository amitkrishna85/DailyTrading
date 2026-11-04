export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol = 'RELIANCE.NS', range = '1d', interval = '5m' } = req.query;
  let cleanSym = String(symbol).trim().toUpperCase();
  if (!cleanSym.endsWith('.NS') && !cleanSym.endsWith('.BO')) {
    cleanSym = `${cleanSym}.NS`;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?range=${range}&interval=${interval}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      throw new Error('No chart data found in Yahoo Finance response');
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const bars = [];
    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const v = volumes[i] || 0;

      if (o !== null && h !== null && l !== null && c !== null && !isNaN(o) && !isNaN(c)) {
        bars.push({
          time: t,
          open: Math.round(o * 100) / 100,
          high: Math.round(h * 100) / 100,
          low: Math.round(l * 100) / 100,
          close: Math.round(c * 100) / 100,
          volume: Math.round(v)
        });
      }
    }

    const regularMarketPrice = result.meta?.regularMarketPrice || (bars.length > 0 ? bars[bars.length - 1].close : null);

    return res.status(200).json({
      symbol: cleanSym,
      currency: result.meta?.currency || 'INR',
      regularMarketPrice,
      bars,
      is_fallback: false
    });
  } catch (err) {
    console.error('Yahoo Finance fetch error:', err.message);
    return res.status(200).json({
      symbol: cleanSym,
      currency: 'INR',
      is_fallback: true,
      error: err.message,
      bars: []
    });
  }
}
