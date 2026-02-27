import datetime
import uuid

from pydantic import BaseModel, Field


class TemplateSegmentCreate(BaseModel):
    name: str = Field(max_length=255)
    position: int = Field(gt=0)
    duration_full: int = Field(gt=0)
    duration_short: int | None = None
    note: str | None = None


class TemplateSegmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    position: int
    duration_full: int
    duration_short: int | None
    note: str | None

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    name: str = Field(max_length=255)
    note: str | None = None
    segments: list[TemplateSegmentCreate] = Field(default_factory=list)


class TemplateUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    note: str | None = None
    segments: list[TemplateSegmentCreate] | None = None


class TemplateListResponse(BaseModel):
    id: uuid.UUID
    name: str
    note: str | None
    total_duration_full: int
    total_duration_short: int
    segment_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class TemplateDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    note: str | None
    total_duration_full: int
    total_duration_short: int
    segments: list[TemplateSegmentResponse]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
