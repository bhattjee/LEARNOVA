"""
config.py — Application settings loaded from environment variables.
Uses pydantic-settings for validation and type safety.
Fails at startup if any required variable is missing.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated application configuration from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50
    allowed_origins: str
    storage_type: str = "local"
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    resend_api_key: str = ""
    email_from: str = "noreply@learnova.local"

    @field_validator("database_url")
    @classmethod
    def database_must_be_postgresql(cls, value: str) -> str:
        if not value.startswith("postgresql"):
            msg = "DATABASE_URL must use a postgresql scheme"
            raise ValueError(msg)
        return value

    @field_validator("jwt_secret_key")
    @classmethod
    def jwt_secret_min_length(cls, value: str) -> str:
        if len(value) < 32:
            msg = "JWT_SECRET_KEY must be at least 32 characters"
            raise ValueError(msg)
        return value

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
