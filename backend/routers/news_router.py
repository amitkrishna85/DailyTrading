from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List
from backend.services import user_manager
from backend.services.runner import run_skill_script

router = APIRouter(prefix="/api/news", tags=["News & Catalysts"])


class NewsRequest(BaseModel):
    tickers: Optional[str] = "RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS"
    hours: int = 24
    include_all: bool = True


@router.post("/fetch")
async def fetch_news(req: NewsRequest, user: str = Query(default="default")):
    user_cfg = user_manager.get_user_file(user, "config.json")
    user_state = user_manager.get_user_file(user, "state/news.json")

    args = ["--config", user_cfg, "--state", user_state, "--hours", str(req.hours), "--json"]
    if req.include_all:
        args.append("--all")

    if req.tickers:
        ticker_list = [t.strip() for t in req.tickers.split(",") if t.strip()]
        if ticker_list:
            args.append("--tickers")
            args.extend(ticker_list)

    res = await run_skill_script("trader-news", "news.py", args, timeout=60)
    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "news": res["data"],
        "command": res["command"]
    }

