import datetime
import uuid
from typing import Literal

from pydantic import BaseModel, Field


class SegmentVariantCreate(BaseModel):
    variant_type: Literal["full", "short", "extended", "acoustic"]
    duration_seconds: int = Field(gt=0)
    description: str | None = None


class SegmentVariantResponse(BaseModel):
    id: uuid.UUID
    variant_type: str
    duration_seconds: int
    description: str | None

    model_config = {"from_attributes": True}


class SegmentCreate(BaseModel):
    name: str = Field(max_length=255)
    type: Literal["song", "intro", "outro", "interlude"] = "song"
    bpm: int | None = Field(default=None, gt=0)
    genre: str | None = Field(default=None, max_length=100)
    expected_energy: float = Field(default=0.5, ge=0.0, le=1.0)
    is_locked: bool = False
    is_skippable: bool = True
    has_pyro: bool = False
    notes: str | None = None
    variants: list[SegmentVariantCreate] = Field(default_factory=list)


class SegmentUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    type: Literal["song", "intro", "outro", "interlude"] | None = None
    bpm: int | None = Field(default=None, gt=0)
    genre: str | None = Field(default=None, max_length=100)
    expected_energy: float | None = Field(default=None, ge=0.0, le=1.0)
    is_locked: bool | None = None
    is_skippable: bool | None = None
    has_pyro: bool | None = None
    notes: str | None = None
    variants: list[SegmentVariantCreate] | None = None


class SegmentResponse(BaseModel):
    id: uuid.UUID
    show_id: uuid.UUID
    name: str
    position: int
    type: str
    bpm: int | None
    genre: str | None
    expected_energy: float
    is_locked: bool
    is_skippable: bool
    has_pyro: bool
    notes: str | None
    created_at: datetime.datetime
    variants: list[SegmentVariantResponse]

    model_config = {"from_attributes": True}


class SegmentReorderRequest(BaseModel):
    segment_ids: list[uuid.UUID] = Field(min_length=1)


class CsvImportRow(BaseModel):
    name: str = Field(max_length=255)
    duration_full: int = Field(gt=0)
    duration_short: int | None = None


class CsvImportRequest(BaseModel):
    segments: list[CsvImportRow] = Field(min_length=1)
