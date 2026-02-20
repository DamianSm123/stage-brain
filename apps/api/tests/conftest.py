import os

import pytest
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

import src.models  # noqa: F401
from src.core.settings import settings

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", settings.DATABASE_URL)


@pytest.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine(TEST_DATABASE_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session, session.begin():
        yield session
        # Rollback happens automatically when exiting begin() without commit
    await engine.dispose()
