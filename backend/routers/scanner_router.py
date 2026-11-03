import json
import os
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from backend.services import user_manager
from backend.services.runner import run_skill_script

router = APIRouter(prefix="/api/scanner", tags=["Scanner"])

ROOT_NIFTY_PATH = os.path.join(user_manager.ROOT_DIR, "MyNifty50List.txt")


class ScanRequest(BaseModel):
    mode: str = "daily"  # "daily" | "orb"
    target_list: str = "nifty50"  # "nifty50" | "custom"
    custom_symbols: Optional[str] = None
    limit: Optional[int] = 50
    at_time: Optional[str] = None


class NiftyListUpdateRequest(BaseModel):
    content: str
    update_global: Optional[bool] = False


@router.get("/nifty50")
def get_nifty50_list(user: str = Query(default="default")):
    user_nifty = user_manager.get_user_file(user, "MyNifty50List.txt")
    target_path = user_nifty if os.path.exists(user_nifty) else ROOT_NIFTY_PATH

    if not os.path.exists(target_path):
        return {"content": "", "symbols": [], "is_user_custom": False}

    with open(target_path, "r", encoding="utf-8") as f:
        content = f.read()

    symbols = [line.strip() for line in content.splitlines() if line.strip() and not line.strip().startswith("#")]
    return {
        "content": content,
        "symbols": symbols,
        "count": len(symbols),
        "is_user_custom": os.path.exists(user_nifty)
    }


@router.put("/nifty50")
def update_nifty50_list(req: NiftyListUpdateRequest, user: str = Query(default="default")):
    user_nifty = user_manager.get_user_file(user, "MyNifty50List.txt")
    target_path = ROOT_NIFTY_PATH if req.update_global else user_nifty

    lines = [l.strip() for l in req.content.splitlines() if l.strip()]
    cleaned_content = "\n".join(lines) + "\n"

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(cleaned_content)

    return {
        "status": "success",
        "message": f"Nifty 50 watchlist saved ({len(lines)} symbols).",
        "count": len(lines),
        "saved_path": target_path
    }


@router.get("/watchlist")
def get_watchlist(user: str = Query(default="default")):
    watchlist_path = user_manager.get_user_file(user, "watchlist.json")
    if not os.path.exists(watchlist_path):
        return {"items": [], "updated_at": None}
    try:
        with open(watchlist_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"data": data}
    except Exception as e:
        return {"items": [], "error": str(e)}


@router.post("/run")
async def run_scanner(req: ScanRequest, user: str = Query(default="default")):
    user_out = user_manager.get_user_file(user, "watchlist.json")
    user_nifty = user_manager.get_user_file(user, "MyNifty50List.txt")
    nifty_path = user_nifty if os.path.exists(user_nifty) else ROOT_NIFTY_PATH

    args = [req.mode, "--out", user_out, "--json"]

    if req.mode == "daily":
        if req.target_list == "nifty50":
            args += ["--watchlist", nifty_path]
        elif req.target_list == "custom" and req.custom_symbols:
            args += ["--symbols", req.custom_symbols]
        elif req.limit:
            args += ["--limit", str(req.limit)]
    elif req.mode == "orb":
        # Always scan the Indian basket for ORB
        args += ["--watchlist", nifty_path]
        if req.at_time:
            args += ["--at", req.at_time]
        if req.limit:
            args += ["--max-confirm", str(req.limit)]

    res = await run_skill_script("trader-scanner", "scan.py", args, timeout=120)

    parsed_items = []
    if os.path.exists(user_out):
        try:
            with open(user_out, "r", encoding="utf-8") as f:
                parsed_items = json.load(f)
        except Exception:
            pass

    return {
        "success": res["success"],
        "command": res["command"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "watchlist": parsed_items if parsed_items else res["data"],
        "returncode": res["returncode"]
    }
