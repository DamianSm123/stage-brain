from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://stagebrain:stagebrain@localhost:5432/stagebrain"
    REDIS_URL: str = "redis://localhost:6379/0"
    APP_ENV: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
