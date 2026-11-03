# 📈 Day Trader AI Dashboard & Multi-User Platform

A modern, full-stack, dark-themed day trading control center built on top of the 11 modular Day Trader Python tools.

---

## ⚡ Quick Start

### 1. Launch with One Click
On Windows, double-click:
```bat
start.bat
```
or run via PowerShell:
```powershell
.\start.ps1
```

Both servers will launch:
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend & Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👤 Multi-User Configuration Isolation

Every trader gets their own isolated workspace directory under `trader/users/<username>/`:
- `config.json` -- Personal account budget, risk limits, trading windows, paper mode toggle
- `watchlist.json` -- Active scan results
- `plan.json` -- Entry price, stop-loss, and profit targets
- `orders.json` -- Computed position sizing
- `verdicts.json` -- 8-rule risk evaluation results
- `alerts.json` -- Price & time alerts
- `trade_log.jsonl` -- Permanent audit log of executed orders

Switch trader profiles seamlessly from the dropdown in the top header or click the **`+`** button to create a new trader profile on the fly.

---

## 🧭 Step-by-Step Decision Pipeline

Navigate to **Decision Pipeline** in the sidebar:

1. **Step 1: Entry Timer** (`trader-entry`):
   - Choose your setup (ORB 15m, 20-day Breakout, Bull Flag, MA Reclaim, RSI Bounce).
   - Click **Check Status Once** or **Watch Bar-by-Bar (SSE)** to stream real-time candlestick progression.
2. **Step 2: Exit Planner** (`trader-exit`):
   - Configure planned entry price, stop-loss placement (Range Midpoint, Range Low, ATR, or % below), and target multiplier (1R, 1.5R, 2R).
   - Locks in reward:risk before risking any capital.
3. **Step 3: The Time Machine** (`trader-timemachine`):
   - Simulates 1,000 to 10,000 sessions drawn from the stock's own historical 5-minute candles.
   - Computes empirical probabilities: Target Hit %, Stop Hit %, and Open at Close %.
4. **Step 4: Budget Sizer** (`trader-budget`):
   - Sizes position strictly so that stop-out loss never exceeds your `max_loss_per_trade_usd`.
   - Accounts for cash buffers and max position caps.
5. **Step 5: Risk Gatekeeper** (`trader-risk`):
   - Evaluates the 8 mandatory risk rules.
   - If any rule blocks, order dispatch is locked until parameters are adjusted.
6. **Step 6: Broker Ticket & Confirmation** (`trader-broker`):
   - Displays plain-English bracket order ticket.
   - Two-factor safety confirmation: requires the user to explicitly type `"YES"` in the confirmation dialog.
   - Automatically logs dispatch to `trade_log.jsonl` in paper mode.

---

## 🇮🇳 Indian Markets (NSE/Nifty 50) Support
- In **Trader Config** (Settings), click **"🇮🇳 India NSE Preset"** to configure IST trading hours (09:15 - 15:30 IST) and flattening time (15:15 IST).
- In the **Scanner**, choose the **"Nifty 50 Basket"** target list to scan all 50 constituents in `MyNifty50List.txt`.

---

## 🛠️ Developer Verification & Testing

Run all unit test suites:
```powershell
# Backend API tests
python -m unittest backend/tests/test_backend.py

# Repo and skill tests
python -m unittest discover -s tests -p "test_repo.py"
python -m unittest discover -s tests -p "test_india.py"

# Build production frontend
cd frontend
npm run build
```

