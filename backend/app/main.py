"""
main.py — FastAPI application entry point. Registers all routers, middleware,
and startup/shutdown events.
"""

import logging

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.middleware.cors_middleware import add_cors_middleware
from app.routers import auth, courses, health, learner, lessons, quizzes, reporting, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnova")

app = FastAPI(title="Learnova API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

add_cors_middleware(app)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["courses"])
app.include_router(learner.router, prefix="/api/v1", tags=["learner"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(lessons.router, prefix="/api/v1", tags=["lessons"])
app.include_router(quizzes.router, prefix="/api/v1", tags=["quizzes"])
app.include_router(reporting.router, prefix="/api/v1", tags=["reporting"])


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Learnova API started")
