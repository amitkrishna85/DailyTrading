export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let tickers = 'RELIANCE.NS,TCS.NS';
  if (req.body && req.body.tickers) {
    tickers = req.body.tickers;
  } else if (req.query && req.query.tickers) {
    tickers = req.query.tickers;
  }

  const tickerList = tickers.split(',').map(s => s.trim()).filter(Boolean);
  const items = [];

  for (const t of tickerList) {
    const cleanSym = t.replace(/\.NS|\.BO/i, '');
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanSym + ' share price NSE')}&hl=en-IN&gl=IN&ceid=IN:en`;
      const rssResp = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (rssResp.ok) {
        const xmlText = await rssResp.text();
        const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
          const itemXml = itemMatches[i];
          const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
          const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

          if (titleMatch && linkMatch) {
            let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            const link = linkMatch[1].trim();
            const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
            const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'Financial Press';

            let tag = 'Macro';
            const lower = title.toLowerCase();
            if (lower.includes('result') || lower.includes('profit') || lower.includes('quarter') || lower.includes('q1') || lower.includes('q2') || lower.includes('q3') || lower.includes('q4') || lower.includes('earning')) tag = 'Earnings';
            else if (lower.includes('target') || lower.includes('buy') || lower.includes('sell') || lower.includes('broker') || lower.includes('upgrade') || lower.includes('downgrade') || lower.includes('call')) tag = 'Analyst';
            else if (lower.includes('rbi') || lower.includes('sebi') || lower.includes('order') || lower.includes('tax') || lower.includes('notice') || lower.includes('penalty')) tag = 'Regulatory';
            else if (lower.includes('deal') || lower.includes('acquire') || lower.includes('stake') || lower.includes('merger') || lower.includes('contract') || lower.includes('invest')) tag = 'Deal';
            else if (lower.includes('surge') || lower.includes('jump') || lower.includes('fall') || lower.includes('high') || lower.includes('low') || lower.includes('rally') || lower.includes('crash')) tag = 'Momentum';

            items.push({
              ticker: t,
              title,
              headline: title,
              link,
              tag,
              source,
              time: pubDate ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch RSS for ${t}:`, e);
    }
  }

  return res.status(200).json({
    success: true,
    items,
    news: items
  });
}
