"""
limiter.py — Shared SlowAPI rate limiter instance for route decorators.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
