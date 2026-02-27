from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.database import engine
from src.core.settings import settings
from src.routers import calibrations, segments, shows, templates, venues


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(title="StageBrain API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(shows.router, prefix="/api/v1")
app.include_router(venues.router, prefix="/api/v1")
app.include_router(calibrations.router, prefix="/api/v1")
app.include_router(segments.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "environment": settings.APP_ENV,
    }
