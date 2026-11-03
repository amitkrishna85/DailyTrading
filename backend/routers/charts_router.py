import json
import os
import urllib.request
import urllib.error
import time
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/charts", tags=["Interactive Charts & Bars"])

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"


def yahoo_symbol(sym: str) -> str:
    s = sym.strip().upper()
    if s.endswith(".NS") or s.endswith(".BO"):
        return s
    return f"{s}.NS"


def generate_fallback_bars(symbol: str, count: int = 75, interval: str = "5m") -> List[Dict[str, Any]]:
    clean = symbol.upper()
    if "RELIANCE" in clean:
        base = 2980.5
    elif "TCS" in clean:
        base = 3960.0
    elif "HDFC" in clean:
        base = 1685.0
    elif "INFY" in clean:
        base = 1825.0
    elif "ICICI" in clean:
        base = 1245.0
    elif "SBI" in clean:
        base = 825.0
    elif "TATA" in clean:
        base = 985.0
    elif "BHARTI" in clean:
        base = 1570.0
    else:
        base = 2450.0

    step = 300
    if interval == "1m":
        step = 60
    elif interval == "15m":
        step = 900
    elif interval == "1d":
        step = 86400

    now = int(time.time())
    current_step = (now // step) * step
    start_step = current_step - (count * step)

    bars = []
    cur = base - 10.0
    for i in range(count):
        t = start_step + (i * step)
        o = round(cur, 2)
        delta = ((i % 5 - 2) * 1.5) + ((i % 3 - 1) * 2.0)
        c = round(o + delta, 2)
        h = round(max(o, c) + abs(delta * 0.5) + 1.2, 2)
        l = round(max(1.0, min(o, c) - abs(delta * 0.4) - 0.8), 2)
        cur = c
        bars.append({
            "time": t,
            "open": o,
            "high": h,
            "low": l,
            "close": c,
            "volume": 10000 + i * 400
        })
    return bars


@router.get("/bars")
def get_chart_bars(
    symbol: str = Query(default="RELIANCE.NS"),
    range_str: str = Query(default="1d", alias="range"),
    interval: str = Query(default="5m")
):
    """Fetch OHLCV candlestick bars formatted for Lightweight Charts (INR)."""
    clean_sym = yahoo_symbol(symbol)
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{clean_sym}?range={range_str}&interval={interval}"

    data = None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        url_fb = f"https://query1.finance.yahoo.com/v8/finance/chart/{clean_sym}?range={range_str}&interval={interval}"
        try:
            req_fb = urllib.request.Request(url_fb, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req_fb, timeout=5) as resp_fb:
                data = json.loads(resp_fb.read().decode("utf-8"))
        except Exception:
            pass

    if not data or not data.get("chart", {}).get("result"):
        return {
            "symbol": clean_sym,
            "currency": "INR",
            "is_fallback": True,
            "bars": generate_fallback_bars(clean_sym, 75, interval)
        }

    try:
        res = data["chart"]["result"][0]
        timestamps = res.get("timestamp", [])
        quote = res["indicators"]["quote"][0]
        opens = quote.get("open", [])
        highs = quote.get("high", [])
        lows = quote.get("low", [])
        closes = quote.get("close", [])
        volumes = quote.get("volume", [])

        bars = []
        for i in range(len(timestamps)):
            t = timestamps[i]
            o = opens[i] if i < len(opens) else None
            h = highs[i] if i < len(highs) else None
            l = lows[i] if i < len(lows) else None
            c = closes[i] if i < len(closes) else None
            v = volumes[i] if i < len(volumes) else 0

            if o is not None and h is not None and l is not None and c is not None:
                bars.append({
                    "time": int(t),
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2),
                    "volume": int(v or 0)
                })

        if not bars:
            bars = generate_fallback_bars(clean_sym, 75, interval)

        return {
            "symbol": clean_sym,
            "currency": res.get("meta", {}).get("currency", "INR"),
            "regularMarketPrice": res.get("meta", {}).get("regularMarketPrice"),
            "bars": bars
        }
    except Exception:
        return {
            "symbol": clean_sym,
            "currency": "INR",
            "is_fallback": True,
            "bars": generate_fallback_bars(clean_sym, 75, interval)
        }
