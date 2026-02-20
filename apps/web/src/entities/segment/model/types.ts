export type SegmentType = "song" | "intro" | "outro" | "interlude";

export type SegmentStatus = "planned" | "active" | "completed" | "skipped";

export interface SegmentVariant {
  id: string;
  variant_type: "full" | "short" | "extended" | "acoustic";
  duration_seconds: number;
}

export interface Segment {
  id: string;
  name: string;
  position: number;
  type: SegmentType;
  bpm?: number;
  genre?: string;
  expected_energy: number;
  is_locked: boolean;
  is_skippable: boolean;
  has_pyro: boolean;
  notes?: string;
  variants: SegmentVariant[];
}

export interface Setlist {
  id: string;
  name: string;
  segments: Segment[];
  total_planned_duration_seconds: number;
}

export interface TimelineEntry {
  segment_id: string;
  status: SegmentStatus;
  variant_used?: string;
  started_at?: string;
  ended_at?: string;
  planned_duration_seconds: number;
  actual_duration_seconds?: number;
  delta_seconds?: number;
}
