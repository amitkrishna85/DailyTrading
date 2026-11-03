import asyncio
import json
import os
import sys
from typing import List, Dict, Any, Optional, Tuple

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def run_command_async(
    cmd_args: List[str],
    cwd: Optional[str] = None,
    timeout: int = 60,
    env_override: Optional[Dict[str, str]] = None
) -> Tuple[int, str, str]:
    """Execute a command asynchronously and capture returncode, stdout, stderr."""
    run_cwd = cwd or ROOT_DIR
    env = os.environ.copy()
    if env_override:
        env.update(env_override)

    proc = await asyncio.create_subprocess_exec(
        *cmd_args,
        cwd=run_cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env
    )

    try:
        stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        return proc.returncode or 0, stdout, stderr
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except ProcessLookupError:
            pass
        return -1, "", f"Command timed out after {timeout} seconds"


def parse_json_or_text(stdout: str) -> Any:
    """Attempt to parse JSON from stdout; if it fails, return raw text or line-split structure."""
    trimmed = stdout.strip()
    if not trimmed:
        return {}
    
    # Try exact JSON
    try:
        return json.loads(trimmed)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object/array substring if script had banner text
    start_bracket = trimmed.find("[")
    start_brace = trimmed.find("{")
    
    start_idx = -1
    if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
        start_idx = start_bracket
        end_idx = trimmed.rfind("]")
    elif start_brace != -1:
        start_idx = start_brace
        end_idx = trimmed.rfind("}")

    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        try:
            return json.loads(trimmed[start_idx : end_idx + 1])
        except json.JSONDecodeError:
            pass

    return {"raw": trimmed}


async def run_skill_script(
    skill_folder: str,
    script_name: str,
    extra_args: List[str],
    timeout: int = 60,
    env_override: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Helper to run a Python script in trader-*/ with Python executable."""
    script_path = os.path.join(ROOT_DIR, skill_folder, script_name)
    cmd = [sys.executable, script_path] + extra_args

    rc, stdout, stderr = await run_command_async(cmd, cwd=ROOT_DIR, timeout=timeout, env_override=env_override)
    parsed = parse_json_or_text(stdout)

    return {
        "success": rc == 0,
        "returncode": rc,
        "stdout": stdout,
        "stderr": stderr,
        "data": parsed,
        "command": " ".join(cmd)
    }

