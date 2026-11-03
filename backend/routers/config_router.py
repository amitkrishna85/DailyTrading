import datetime
import zoneinfo
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.services import user_manager

router = APIRouter(prefix="/api", tags=["Configuration & Users"])


class CreateUserRequest(BaseModel):
    username: str


class UpdateConfigRequest(BaseModel):
    config: Dict[str, Any]


@router.get("/users")
def get_users() -> List[str]:
    user_manager.ensure_users_dir()
    users_data = user_manager.list_users()
    return [u["username"] for u in users_data]


@router.post("/users")
def create_user_profile(req: CreateUserRequest):
    try:
        user = user_manager.create_user(req.username)
        return {"status": "success", "username": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config")
def get_configuration(user: str = Query(default="default")):
    try:
        cfg = user_manager.get_user_config(user)
        return {"user": user, "config": cfg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/config")
def update_configuration(req: UpdateConfigRequest, user: str = Query(default="default")):
    try:
        saved = user_manager.save_user_config(user, req.config)
        return {"status": "success", "user": user, "config": saved}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/config/reset")
def reset_configuration(user: str = Query(default="default")):
    try:
        cfg = user_manager.reset_user_config(user)
        return {"status": "success", "user": user, "config": cfg}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/market/status")
def get_market_status():
    """Return live clock and market session status for Indian Markets (NSE/BSE) in IST."""
    try:
        tz_ist = zoneinfo.ZoneInfo("Asia/Kolkata")
    except Exception:
        tz_ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    now_ist = now_utc.astimezone(tz_ist)

    # Indian Market Hours: 09:15 - 15:30 IST (Mon-Fri)
    in_is_weekday = now_ist.weekday() < 5
    in_time = now_ist.time()
    in_status = "CLOSED"

    if in_is_weekday:
        if datetime.time(9, 0) <= in_time < datetime.time(9, 15):
            in_status = "PRE-MARKET"
        elif datetime.time(9, 15) <= in_time < datetime.time(15, 30):
            in_status = "OPEN"
        elif datetime.time(15, 30) <= in_time < datetime.time(16, 0):
            in_status = "POST-MARKET"

    return {
        "india": {
            "time_str": now_ist.strftime("%H:%M:%S IST"),
            "date_str": now_ist.strftime("%d-%m-%Y"),
            "status": in_status,
            "timezone": "Asia/Kolkata",
            "currency": "INR",
            "currency_symbol": "₹",
            "exchange": "NSE/BSE"
        }
    }
