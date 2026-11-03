import json
import os
import shutil
import datetime
from typing import Dict, Any, List, Optional

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRADER_DIR = os.path.join(ROOT_DIR, "trader")
USERS_DIR = os.path.join(TRADER_DIR, "users")
DEFAULT_CONFIG_PATH = os.path.join(TRADER_DIR, "config.json")
AUTH_FILE = os.path.join(USERS_DIR, "_auth_registry.json")


def load_auth_registry() -> Dict[str, Any]:
    if not os.path.exists(AUTH_FILE):
        return {}
    try:
        with open(AUTH_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_auth_registry(registry: Dict[str, Any]):
    os.makedirs(USERS_DIR, exist_ok=True)
    with open(AUTH_FILE, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)


def ensure_users_dir():
    os.makedirs(USERS_DIR, exist_ok=True)
    registry = load_auth_registry()

    # Ensure admin user exists
    if "admin" not in registry:
        registry["admin"] = {
            "username": "admin",
            "role": "admin",
            "password": "admin",  # default password
            "is_onboarded": True,
            "created_at": datetime.datetime.now().isoformat()
        }

    # Ensure default trader exists
    if "default" not in registry:
        registry["default"] = {
            "username": "default",
            "role": "trader",
            "password": "",
            "is_onboarded": False,
            "created_at": datetime.datetime.now().isoformat()
        }

    save_auth_registry(registry)
    create_user("admin", role="admin")
    create_user("default", role="trader")


def get_user_dir(username: str) -> str:
    safe_name = "".join(c for c in username if c.isalnum() or c in ("-", "_")).strip()
    if not safe_name:
        safe_name = "default"
    user_dir = os.path.join(USERS_DIR, safe_name)
    os.makedirs(user_dir, exist_ok=True)
    os.makedirs(os.path.join(user_dir, "state"), exist_ok=True)
    return user_dir


def get_user_file(username: str, filename: str) -> str:
    user_dir = get_user_dir(username)
    return os.path.join(user_dir, filename)


def list_users() -> List[Dict[str, Any]]:
    registry = load_auth_registry()
    users_on_disk = [d for d in os.listdir(USERS_DIR) if os.path.isdir(os.path.join(USERS_DIR, d)) and not d.startswith("_")]
    
    result = []
    for u in sorted(users_on_disk):
        info = registry.get(u, {
            "username": u,
            "role": "admin" if u == "admin" else "trader",
            "is_onboarded": True,
            "created_at": None
        })
        result.append(info)
    return result


def create_user(username: str, role: str = "trader", password: str = "") -> str:
    safe_name = "".join(c for c in username if c.isalnum() or c in ("-", "_")).strip()
    if not safe_name:
        raise ValueError("Invalid username")

    user_dir = get_user_dir(safe_name)
    user_cfg = os.path.join(user_dir, "config.json")

    if not os.path.exists(user_cfg):
        if os.path.exists(DEFAULT_CONFIG_PATH):
            shutil.copyfile(DEFAULT_CONFIG_PATH, user_cfg)
        else:
            default_config = {
                "budget": 100000,
                "cash_buffer_pct": 10,
                "max_position_pct": 75,
                "max_order_usd": 100000,
                "min_order_usd": 5,
                "max_loss_per_trade_usd": 1000,
                "max_daily_loss_usd": 3000,
                "max_trades_per_day": 3,
                "max_orders_per_day": 10,
                "min_reward_risk": 1.0,
                "require_stop": True,
                "no_entries_before": "09:20",
                "no_entries_after": "14:30",
                "flat_by": "15:15",
                "fractional": False,
                "broker": "paper",
                "paper": True,
                "blocked": [],
                "allow_options": False,
                "allow_margin": False,
                "allow_short": False,
                "pdt_guard": False,
                "sec_user_agent": "Trader user@example.com"
            }
            with open(user_cfg, "w", encoding="utf-8") as f:
                json.dump(default_config, f, indent=2)

    # Update registry
    registry = load_auth_registry()
    if safe_name not in registry:
        registry[safe_name] = {
            "username": safe_name,
            "role": role,
            "password": password,
            "is_onboarded": False if role != "admin" else True,
            "created_at": datetime.datetime.now().isoformat()
        }
        save_auth_registry(registry)

    return safe_name


def authenticate(username: str, password: str = "") -> Optional[Dict[str, Any]]:
    registry = load_auth_registry()
    user_info = registry.get(username)
    if not user_info:
        # If user folder exists, create default entry
        if os.path.isdir(os.path.join(USERS_DIR, username)):
            create_user(username)
            registry = load_auth_registry()
            user_info = registry.get(username)
        else:
            return None

    if user_info.get("role") == "admin":
        if user_info.get("password") and user_info.get("password") != password:
            return None
    elif user_info.get("password"):
        if user_info.get("password") != password:
            return None

    return {
        "username": user_info["username"],
        "role": user_info.get("role", "trader"),
        "is_onboarded": user_info.get("is_onboarded", True)
    }


def set_user_onboarded(username: str, status: bool = True):
    registry = load_auth_registry()
    if username in registry:
        registry[username]["is_onboarded"] = status
        save_auth_registry(registry)


def delete_user(username: str) -> bool:
    if username in ("admin", "default"):
        raise ValueError("Cannot delete system protected users (admin, default)")
    safe_name = "".join(c for c in username if c.isalnum() or c in ("-", "_")).strip()
    user_dir = os.path.join(USERS_DIR, safe_name)
    if os.path.exists(user_dir):
        shutil.rmtree(user_dir, ignore_errors=True)
    registry = load_auth_registry()
    if safe_name in registry:
        del registry[safe_name]
        save_auth_registry(registry)
    return True


def get_user_config(username: str) -> Dict[str, Any]:
    user_dir = get_user_dir(username)
    cfg_path = os.path.join(user_dir, "config.json")
    if not os.path.exists(cfg_path):
        create_user(username)
    with open(cfg_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_user_config(username: str, config: Dict[str, Any]) -> Dict[str, Any]:
    user_dir = get_user_dir(username)
    cfg_path = os.path.join(user_dir, "config.json")
    with open(cfg_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    return config


def reset_user_config(username: str) -> Dict[str, Any]:
    user_dir = get_user_dir(username)
    cfg_path = os.path.join(user_dir, "config.json")
    if os.path.exists(DEFAULT_CONFIG_PATH):
        shutil.copyfile(DEFAULT_CONFIG_PATH, cfg_path)
    return get_user_config(username)


def get_admin_system_metrics() -> Dict[str, Any]:
    registry = load_auth_registry()
    all_users = list_users()

    total_trades_count = 0
    all_trades = []

    for u in all_users:
        uname = u["username"]
        log_file = get_user_file(uname, "trade_log.jsonl")
        if os.path.exists(log_file):
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            t = json.loads(line)
                            all_trades.append(t)
                            total_trades_count += 1
            except Exception:
                pass

    return {
        "total_users": len(all_users),
        "total_trades_executed": total_trades_count,
        "users": all_users,
        "recent_global_trades": list(reversed(all_trades[-50:]))
    }
