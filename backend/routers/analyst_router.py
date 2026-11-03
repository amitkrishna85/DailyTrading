from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from backend.services import user_manager
from backend.services.runner import run_skill_script

router = APIRouter(prefix="/api/analyst", tags=["Earnings Analyst"])


class AnalystRequest(BaseModel):
    ticker: str = "TSLA"
    quarters: int = 8


@router.post("/facts")
async def get_analyst_facts(req: AnalystRequest, user: str = Query(default="default")):
    user_config = user_manager.get_user_file(user, "config.json")
    args = [req.ticker, "--quarters", str(req.quarters), "--config", user_config, "--json"]

    res = await run_skill_script("trader-analyst", "facts.py", args, timeout=60)
    return {
        "success": res["success"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "facts": res["data"],
        "command": res["command"]
    }

