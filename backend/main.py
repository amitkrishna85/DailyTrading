import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import (
    config_router,
    scanner_router,
    news_router,
    pipeline_router,
    alerts_router,
    analyst_router,
    auth_router,
    charts_router,
)
from backend.services import user_manager

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    user_manager.ensure_users_dir()
    yield

app = FastAPI(
    title="Day Trader AI Dashboard API",
    description="Multi-User REST & Real-Time API wrapping the Day Trader Skill Suite.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Day Trader API",
        "users_count": len(user_manager.list_users())
    }

# Include all modular routers
app.include_router(config_router.router)
app.include_router(scanner_router.router)
app.include_router(news_router.router)
app.include_router(pipeline_router.router)
app.include_router(alerts_router.router)
app.include_router(analyst_router.router)
app.include_router(auth_router.router)
app.include_router(charts_router.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
