import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.services import user_manager

router = APIRouter(prefix="/api/auth", tags=["Authentication & Administration"])


class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = ""
    role: Optional[str] = "trader"  # "admin" | "trader"


class OnboardingRequest(BaseModel):
    username: str
    budget: float = 500000.0  # ₹5,00,000 INR default
    max_loss_per_trade: float = 5000.0  # 1%
    max_daily_loss: float = 15000.0  # 3%
    paper: bool = True


@router.post("/login")
def login(req: LoginRequest):
    user_manager.ensure_users_dir()
    auth_res = user_manager.authenticate(req.username, req.password or "")
    if not auth_res:
        if req.role == "trader":
            user_manager.create_user(req.username, role="trader", password=req.password or "")
            auth_res = user_manager.authenticate(req.username, req.password or "")
        else:
            raise HTTPException(status_code=401, detail="Invalid admin credentials (default admin password is 'admin')")

    return {
        "status": "success",
        "user": auth_res
    }


@router.get("/me")
def get_current_user_profile(user: str = Query(default="default")):
    registry = user_manager.load_auth_registry()
    info = registry.get(user)
    if not info:
        return {
            "username": user,
            "role": "admin" if user == "admin" else "trader",
            "is_onboarded": True
        }
    return {
        "username": info["username"],
        "role": info.get("role", "trader"),
        "is_onboarded": info.get("is_onboarded", True)
    }


@router.post("/onboarding")
def complete_onboarding(req: OnboardingRequest):
    cfg = user_manager.get_user_config(req.username)
    cfg["budget"] = req.budget
    cfg["max_loss_per_trade_usd"] = req.max_loss_per_trade
    cfg["max_daily_loss_usd"] = req.max_daily_loss
    cfg["paper"] = req.paper

    # Enforce NSE / BSE trading session window in IST
    cfg["no_entries_before"] = "09:20"
    cfg["no_entries_after"] = "14:30"
    cfg["flat_by"] = "15:15"
    cfg["pdt_guard"] = False  # Not applicable to Indian markets

    user_manager.save_user_config(req.username, cfg)
    user_manager.set_user_onboarded(req.username, True)

    return {
        "status": "success",
        "message": f"Trader {req.username} onboarded successfully for Indian Markets (NSE).",
        "config": cfg
    }


@router.get("/admin/metrics")
def get_admin_metrics(user: str = Query(default="admin")):
    registry = user_manager.load_auth_registry()
    uinfo = registry.get(user)
    if not uinfo or uinfo.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    return user_manager.get_admin_system_metrics()


@router.delete("/admin/users/{target_user}")
def delete_user_profile(target_user: str, user: str = Query(default="admin")):
    registry = user_manager.load_auth_registry()
    uinfo = registry.get(user)
    if not uinfo or uinfo.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin authorization required")

    try:
        user_manager.delete_user(target_user)
        return {"status": "success", "message": f"User {target_user} deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
