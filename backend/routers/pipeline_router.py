import asyncio
import json
import os
import datetime
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from backend.services import user_manager
from backend.services.runner import run_skill_script, run_command_async, ROOT_DIR

router = APIRouter(prefix="/api/pipeline", tags=["Trade Decision Pipeline"])


# --- Step 1: Entry Models ---
class EntryCheckRequest(BaseModel):
    symbol: str
    setup: str = "orb"  # "orb", "breakout_20d", "bull_flag", "reclaim_ma20", "oversold_bounce"
    interval: str = "5m"


# --- Step 2: Exit Plan Models ---
class ExitPlanRequest(BaseModel):
    symbol: str
    entry_price: Optional[float] = None
    stop: str = "or-mid"  # "or-mid", "or-low", "price:...", "pct:...", "atr:..."
    target: str = "2R"    # "1R", "1.5R", "2R", "price:..."
    flat_by: Optional[str] = None
    side: str = "buy"


# --- Step 3: Time Machine Models ---
class TimeMachineRequest(BaseModel):
    replays: int = 1000
    seed: Optional[int] = 19


# --- Step 4: Budget Size Models ---
class BudgetSizeRequest(BaseModel):
    limit_price: Optional[float] = None


# --- Step 6: Broker Confirm Models ---
class BrokerConfirmRequest(BaseModel):
    confirm_token: str  # Must be "YES"
    order_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Pipeline Status Helper
# ---------------------------------------------------------------------------
@router.get("/status")
def get_pipeline_status(user: str = Query(default="default")):
    """Inspect what pipeline files currently exist for this user."""
    plan_path = user_manager.get_user_file(user, "plan.json")
    orders_path = user_manager.get_user_file(user, "orders.json")
    verdicts_path = user_manager.get_user_file(user, "verdicts.json")
    tm_path = user_manager.get_user_file(user, "timemachine.json")

    def read_json_if_exists(p):
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None
        return None

    return {
        "user": user,
        "plan": read_json_if_exists(plan_path),
        "orders": read_json_if_exists(orders_path),
        "verdicts": read_json_if_exists(verdicts_path),
        "timemachine": read_json_if_exists(tm_path),
    }


# ---------------------------------------------------------------------------
# Step 1: Entry Check & Live Watch (SSE)
# ---------------------------------------------------------------------------
@router.post("/entry/check")
async def check_entry(req: EntryCheckRequest, user: str = Query(default="default")):
    args = ["check", req.symbol, "--setup", req.setup, "--json"]
    res = await run_skill_script("trader-entry", "entry.py", args, timeout=60)
    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "data": res["data"],
        "command": res["command"]
    }


@router.get("/entry/watch")
async def watch_entry_sse(symbol: str, setup: str = "orb", user: str = Query(default="default")):
    """Server-Sent Events streaming bar-by-bar entry status."""
    async def event_generator():
        for i in range(15):  # Poll up to 15 times
            args = ["check", symbol, "--setup", setup, "--json"]
            res = await run_skill_script("trader-entry", "entry.py", args, timeout=30)
            status_data = res.get("data", {})
            event_payload = {
                "iteration": i + 1,
                "symbol": symbol,
                "setup": setup,
                "timestamp": datetime.datetime.now().isoformat(),
                "result": status_data,
                "stdout": res.get("stdout", "")
            }
            yield f"data: {json.dumps(event_payload)}\n\n"

            # If triggered or expired, can finish
            status_str = str(status_data).lower()
            if "triggered" in status_str or "expired" in status_str:
                break
            await asyncio.sleep(5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Step 2: Exit Plan
# ---------------------------------------------------------------------------
@router.post("/exit/plan")
async def plan_exit(req: ExitPlanRequest, user: str = Query(default="default")):
    user_cfg = user_manager.get_user_file(user, "config.json")
    user_plan = user_manager.get_user_file(user, "plan.json")

    args = [
        "plan",
        "--symbol", req.symbol,
        "--stop", req.stop,
        "--target", req.target,
        "--config", user_cfg,
        "--write", user_plan,
        "--json"
    ]
    if req.entry_price:
        args += ["--entry", str(req.entry_price)]
    if req.flat_by:
        args += ["--flat-by", req.flat_by]

    res = await run_skill_script("trader-exit", "exit.py", args, timeout=60)

    # Read plan.json directly
    saved_plan = None
    if os.path.exists(user_plan):
        try:
            with open(user_plan, "r", encoding="utf-8") as f:
                saved_plan = json.load(f)
        except Exception:
            pass

    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "plan": saved_plan if saved_plan else res["data"],
        "command": res["command"]
    }


# ---------------------------------------------------------------------------
# Step 3: Time Machine
# ---------------------------------------------------------------------------
@router.post("/timemachine/run")
async def run_timemachine(req: TimeMachineRequest, user: str = Query(default="default")):
    user_plan = user_manager.get_user_file(user, "plan.json")
    user_tm = user_manager.get_user_file(user, "timemachine.json")

    if not os.path.exists(user_plan):
        raise HTTPException(status_code=400, detail="Plan file does not exist. Please create an exit plan first.")

    args = [
        "run",
        "--plan", user_plan,
        "--replays", str(req.replays),
        "--write", user_tm,
        "--json"
    ]
    if req.seed is not None:
        args += ["--seed", str(req.seed)]

    res = await run_skill_script("trader-timemachine", "timemachine.py", args, timeout=120)

    saved_tm = None
    if os.path.exists(user_tm):
        try:
            with open(user_tm, "r", encoding="utf-8") as f:
                saved_tm = json.load(f)
        except Exception:
            pass

    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "simulation": saved_tm if saved_tm else res["data"],
        "command": res["command"]
    }


# ---------------------------------------------------------------------------
# Step 4: Budget Sizer
# ---------------------------------------------------------------------------
@router.post("/budget/size")
async def size_position(req: BudgetSizeRequest, user: str = Query(default="default")):
    user_cfg = user_manager.get_user_file(user, "config.json")
    user_plan = user_manager.get_user_file(user, "plan.json")
    user_orders = user_manager.get_user_file(user, "orders.json")

    if not os.path.exists(user_plan):
        raise HTTPException(status_code=400, detail="Plan file does not exist. Please create an exit plan first.")

    args = [
        "--plan", user_plan,
        "--config", user_cfg,
        "--write", user_orders,
        "--json"
    ]
    if req.limit_price:
        args += ["--limit", str(req.limit_price)]

    res = await run_skill_script("trader-budget", "size.py", args, timeout=60)

    saved_orders = None
    if os.path.exists(user_orders):
        try:
            with open(user_orders, "r", encoding="utf-8") as f:
                saved_orders = json.load(f)
        except Exception:
            pass

    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "orders": saved_orders if saved_orders else res["data"],
        "command": res["command"]
    }


# ---------------------------------------------------------------------------
# Step 5: Risk Check
# ---------------------------------------------------------------------------
@router.post("/risk/check")
async def check_risk(user: str = Query(default="default")):
    user_cfg = user_manager.get_user_file(user, "config.json")
    user_orders = user_manager.get_user_file(user, "orders.json")
    user_verdicts = user_manager.get_user_file(user, "verdicts.json")

    if not os.path.exists(user_orders):
        raise HTTPException(status_code=400, detail="Orders file does not exist. Please size budget first.")

    args = [
        "--orders", user_orders,
        "--config", user_cfg,
        "--out", user_verdicts,
        "--json"
    ]

    res = await run_skill_script("trader-risk", "check.py", args, timeout=60)

    saved_verdicts = None
    if os.path.exists(user_verdicts):
        try:
            with open(user_verdicts, "r", encoding="utf-8") as f:
                saved_verdicts = json.load(f)
        except Exception:
            pass

    # Determine overall status
    is_pass = False
    if saved_verdicts:
        if isinstance(saved_verdicts, dict) and saved_verdicts.get("verdict") == "PASS":
            is_pass = True
        elif isinstance(saved_verdicts, list) and all(v.get("verdict") == "PASS" for v in saved_verdicts):
            is_pass = True

    return {
        "success": res["success"],
        "is_pass": is_pass,
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "verdicts": saved_verdicts if saved_verdicts else res["data"],
        "command": res["command"]
    }


# ---------------------------------------------------------------------------
# Step 6: Broker Ticket & Two-Factor Confirmation
# ---------------------------------------------------------------------------
@router.post("/broker/ticket")
async def get_broker_ticket(user: str = Query(default="default")):
    user_cfg = user_manager.get_user_file(user, "config.json")
    user_orders = user_manager.get_user_file(user, "orders.json")
    user_verdicts = user_manager.get_user_file(user, "verdicts.json")

    if not os.path.exists(user_orders):
        raise HTTPException(status_code=400, detail="No orders found. Please run budget sizer first.")

    args = [
        "show",
        "--orders", user_orders,
        "--config", user_cfg,
        "--json"
    ]
    if os.path.exists(user_verdicts):
        args += ["--risk", user_verdicts]

    res = await run_skill_script("trader-broker", "ticket.py", args, timeout=60)

    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "ticket": res["data"],
        "command": res["command"]
    }


@router.post("/broker/confirm")
def confirm_order_execution(req: BrokerConfirmRequest, user: str = Query(default="default")):
    """Execute order ticket only if explicit YES token is provided and risk passed."""
    if req.confirm_token.strip().upper() != "YES":
        raise HTTPException(status_code=400, detail="Order execution requires exact confirmation token 'YES'")

    user_verdicts = user_manager.get_user_file(user, "verdicts.json")
    user_orders = user_manager.get_user_file(user, "orders.json")
    user_log = user_manager.get_user_file(user, "trade_log.jsonl")

    if not os.path.exists(user_orders):
        raise HTTPException(status_code=400, detail="No active order found to execute.")

    # Check that risk actually passed
    passed = False
    if os.path.exists(user_verdicts):
        try:
            with open(user_verdicts, "r", encoding="utf-8") as f:
                vdata = json.load(f)
                if isinstance(vdata, dict) and vdata.get("verdict") == "PASS":
                    passed = True
                elif isinstance(vdata, list) and all(v.get("verdict") == "PASS" for v in vdata):
                    passed = True
        except Exception:
            pass

    if not passed:
        raise HTTPException(status_code=403, detail="Risk gatekeeper has NOT passed this trade. Cannot place order.")

    with open(user_orders, "r", encoding="utf-8") as f:
        orders_data = json.load(f)

    # Log execution to trade_log.jsonl
    log_entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "user": user,
        "action": "ORDER_CONFIRMED",
        "orders": orders_data,
        "mode": "PAPER_TRADING"
    }

    with open(user_log, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    return {
        "status": "EXECUTED",
        "message": "Order successfully confirmed and dispatched to paper trading engine.",
        "log_entry": log_entry
    }


@router.get("/broker/history")
def get_trade_history(user: str = Query(default="default")):
    user_log = user_manager.get_user_file(user, "trade_log.jsonl")
    if not os.path.exists(user_log):
        return {"trades": []}

    trades = []
    with open(user_log, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    trades.append(json.loads(line))
                except Exception:
                    pass
    return {"trades": list(reversed(trades))}

