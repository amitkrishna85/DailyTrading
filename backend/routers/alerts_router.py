import asyncio
import json
import os
import datetime
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from backend.services import user_manager
from backend.services.runner import run_skill_script

router = APIRouter(prefix="/api/alerts", tags=["Alerts & Price Monitoring"])


class CustomAlertRequest(BaseModel):
    symbol: str
    condition: str  # "above", "below", "stop", "target", "at"
    value: float | str
    label: Optional[str] = None


@router.get("/list")
def list_alerts(user: str = Query(default="default")):
    rules_path = user_manager.get_user_file(user, "alerts.json")
    if not os.path.exists(rules_path):
        return {"rules": []}
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # data can be a list or dict with "rules"
            if isinstance(data, dict):
                return {"rules": data.get("rules", [])}
            elif isinstance(data, list):
                return {"rules": data}
            return {"rules": []}
    except Exception as e:
        return {"rules": [], "error": str(e)}


@router.post("/add-from-plan")
async def add_alerts_from_plan(user: str = Query(default="default")):
    user_plan = user_manager.get_user_file(user, "plan.json")
    user_rules = user_manager.get_user_file(user, "alerts.json")
    user_config = user_manager.get_user_file(user, "config.json")
    user_state = user_manager.get_user_file(user, "state/alerts.json")

    if not os.path.exists(user_plan):
        raise HTTPException(status_code=400, detail="Plan file does not exist. Create an exit plan first.")

    args = [
        "add",
        "--from-plan",
        "--plan", user_plan,
        "--rules", user_rules,
        "--config", user_config,
        "--state", user_state
    ]

    res = await run_skill_script("trader-alerts", "alerts.py", args, timeout=60)
    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "command": res["command"]
    }


@router.post("/add-rule")
async def add_custom_alert(req: CustomAlertRequest, user: str = Query(default="default")):
    user_rules = user_manager.get_user_file(user, "alerts.json")
    user_state = user_manager.get_user_file(user, "state/alerts.json")

    args = [
        "add",
        "--symbol", req.symbol,
        "--rules", user_rules,
        "--state", user_state
    ]

    if req.condition == "above":
        args += ["--above", str(req.value)]
    elif req.condition == "below":
        args += ["--below", str(req.value)]
    elif req.condition == "stop":
        args += ["--stop", str(req.value)]
    elif req.condition == "target":
        args += ["--target", str(req.value)]
    elif req.condition == "at":
        args += ["--at", str(req.value)]

    if req.label:
        args += ["--label", req.label]

    res = await run_skill_script("trader-alerts", "alerts.py", args, timeout=60)
    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "command": res["command"]
    }


@router.get("/stream")
async def stream_alerts_sse(user: str = Query(default="default")):
    """Streams live check results every few seconds."""
    user_rules = user_manager.get_user_file(user, "alerts.json")
    user_state = user_manager.get_user_file(user, "state/alerts.json")
    user_prices = user_manager.get_user_file(user, "prices.json")

    async def event_generator():
        while True:
            if os.path.exists(user_rules):
                args = [
                    "check",
                    "--rules", user_rules,
                    "--state", user_state,
                    "--prices-out", user_prices,
                    "--json"
                ]
                res = await run_skill_script("trader-alerts", "alerts.py", args, timeout=20)
                payload = {
                    "timestamp": datetime.datetime.now().isoformat(),
                    "data": res.get("data", {}),
                    "stdout": res.get("stdout", "")
                }
                yield f"data: {json.dumps(payload)}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'no_rules', 'timestamp': datetime.datetime.now().isoformat()})}\n\n"
            await asyncio.sleep(10)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

