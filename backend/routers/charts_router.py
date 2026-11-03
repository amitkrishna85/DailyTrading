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
    return s.replace(".", "-")


@router.get("/bars")
def get_chart_bars(
    symbol: str = Query(default="RELIANCE.NS"),
    range_str: str = Query(default="1d", alias="range"),
    interval: str = Query(default="5m")
):
    """Fetch OHLCV candlestick bars formatted for Lightweight Charts (INR)."""
    clean_sym = yahoo_symbol(symbol)
    if not clean_sym.endswith(".NS") and not clean_sym.endswith(".BO"):
        clean_sym = f"{clean_sym}.NS"
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{clean_sym}?range={range_str}&interval={interval}"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        # Fallback to query1
        url_fb = f"https://query1.finance.yahoo.com/v8/finance/chart/{clean_sym}?range={range_str}&interval={interval}"
        try:
            req_fb = urllib.request.Request(url_fb, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req_fb, timeout=10) as resp_fb:
                data = json.loads(resp_fb.read().decode("utf-8"))
        except Exception:
            # If network fails or offline, return simulated realistic bars around a base price
            base = 2500.0 if ".NS" in clean_sym else 350.0
            now = int(time.time())
            simulated = []
            cur = base
            for i in range(50):
                t = now - (50 - i) * 300
                o = round(cur, 2)
                h = round(o + (i % 3 + 1) * 1.2, 2)
                l = round(o - (i % 2 + 1) * 0.9, 2)
                c = round(l + (h - l) * 0.6, 2)
                cur = c
                simulated.append({
                    "time": t,
                    "open": o,
                    "high": h,
                    "low": l,
                    "close": c,
                    "volume": 12000 + i * 500
                })
            return {
                "symbol": symbol,
                "is_fallback": True,
                "bars": simulated
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
                    "time": t,
                    "open": round(o, 2),
                    "high": round(h, 2),
                    "low": round(l, 2),
                    "close": round(c, 2),
                    "volume": int(v or 0)
                })

        return {
            "symbol": symbol,
            "currency": res.get("meta", {}).get("currency", "USD"),
            "regularMarketPrice": res.get("meta", {}).get("regularMarketPrice"),
            "bars": bars
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse chart data: {str(e)}")

