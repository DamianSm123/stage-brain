import type { Recommendation, RecoveryScenario } from "@/entities/recommendation";
import type { Setlist, TimelineEntry } from "@/entities/segment";
import type { Venue, VenueType } from "@/entities/venue";

// --- Live show status (used by showStore for live panel) ---

export type ShowStatus = "setup" | "live" | "paused" | "ended";

export type ShowTimeState = "pre-show" | "on-time" | "delayed" | "buffer-eaten" | "ended";

export interface UndoSnapshot {
  timeline: TimelineEntry[];
  recommendations?: Recommendation[];
  recoveryScenarios?: RecoveryScenario[];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  icon: string;
  message: string;
  reversible: boolean;
  undoSnapshot?: UndoSnapshot;
}

export interface Show {
  id: string;
  name: string;
  status: ShowStatus;
  scheduled_start: string;
  scheduled_end?: string;
  curfew: string;
  actual_start?: string;
  venue: Venue;
  setlist: Setlist;
}

// --- Dashboard show status (used by showsStore for concerts list) ---

export type DashboardShowStatus = "SZKIC" | "GOTOWY" | "NA_ZYWO" | "ZAKONCZONY";

export interface DashboardShow {
  id: string;
  name: string;
  venue: { name: string; city: string; type: VenueType; capacity: number } | null;
  date: string;
  startTime: string;
  endTime: string;
  curfew: string;
  status: DashboardShowStatus;
  segmentCount: number;
  duration: number | null;
  delta: number | null;
  engagement: number | null;
  artists: string[];
  genre: string | null;
  readiness: { details: boolean; setlist: boolean };
  createdAt: string;
  updatedAt: string;
}

// --- Show editor types (used by showEditorStore) ---

export interface EditorSegment {
  id: string;
  name: string;
  durationFull: number;
  durationShort: number | null;
  note: string;
}

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface ShowEditorData {
  name: string;
  artists: string[];
  genre: string | null;

  date: string;
  startTime: string;
  endTime: string;
  curfew: string;

  venueId: string | null;
  venueName: string;
  venueCity: string;
  venueType: VenueType | null;
  venueCapacity: number | null;

  segments: EditorSegment[];
}
