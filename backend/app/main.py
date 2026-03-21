"""
main.py — FastAPI application entry point. Registers all routers, middleware,
and startup/shutdown events.
"""

import logging

from fastapi import FastAPI

from app.middleware.cors_middleware import add_cors_middleware
from app.routers import health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnova")

app = FastAPI(title="Learnova API", version="1.0.0")

add_cors_middleware(app)

app.include_router(health.router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Learnova API started")
