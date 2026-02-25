import type { EngagementMetric, TimestampedScore } from "@/entities/engagement-metric";
import type { Recommendation, RecoveryScenario } from "@/entities/recommendation";
import type { Segment, Setlist, TimelineEntry } from "@/entities/segment";
import type { ActivityLogEntry, Show } from "@/entities/show";
import type { Venue } from "@/entities/venue";

// --- Venue ---

export const MOCK_VENUE: Venue = {
  id: "venue-1",
  name: "Teatr Wielki",
  type: "hall",
  capacity: 3000,
  city: "Warszawa",
};

// --- Segments (Quebonafide setlist) ---

export const MOCK_SEGMENTS: Segment[] = [
  {
    id: "seg-1",
    name: "Tatuaż",
    position: 1,
    type: "song",
    bpm: 90,
    genre: "hip-hop",
    expected_energy: 0.6,
    is_locked: false,
    is_skippable: true,
    has_pyro: false,
    notes: "Dobry opener, buduje energię",
    variants: [
      { id: "var-1a", variant_type: "full", duration_seconds: 210 },
      { id: "var-1b", variant_type: "short", duration_seconds: 165 },
    ],
  },
  {
    id: "seg-2",
    name: "Candy",
    position: 2,
    type: "song",
    bpm: 110,
    genre: "hip-hop",
    expected_energy: 0.8,
    is_locked: false,
    is_skippable: false,
    has_pyro: false,
    variants: [
      { id: "var-2a", variant_type: "full", duration_seconds: 200 },
      { id: "var-2b", variant_type: "short", duration_seconds: 150 },
    ],
  },
  {
    id: "seg-3",
    name: "Bubbletea",
    position: 3,
    type: "song",
    bpm: 100,
    genre: "hip-hop",
    expected_energy: 0.7,
    is_locked: false,
    is_skippable: false,
    has_pyro: false,
    variants: [{ id: "var-3a", variant_type: "full", duration_seconds: 180 }],
  },
  {
    id: "seg-4",
    name: "Jesień",
    position: 4,
    type: "song",
    bpm: 75,
    genre: "hip-hop",
    expected_energy: 0.4,
    is_locked: false,
    is_skippable: true,
    has_pyro: false,
    notes: "Ballada — kontrast energetyczny",
    variants: [
      { id: "var-4a", variant_type: "full", duration_seconds: 240 },
      { id: "var-4b", variant_type: "short", duration_seconds: 180 },
    ],
  },
  {
    id: "seg-5",
    name: "Szubiepp",
    position: 5,
    type: "song",
    bpm: 130,
    genre: "hip-hop",
    expected_energy: 0.95,
    is_locked: true,
    is_skippable: false,
    has_pyro: true,
    notes: "Kontraktowy hit + pirotechnika załadowana",
    variants: [{ id: "var-5a", variant_type: "full", duration_seconds: 195 }],
  },
];

// --- Setlist ---

export const MOCK_SETLIST: Setlist = {
  id: "setlist-1",
  name: "Quebonafide — Full Set",
  segments: MOCK_SEGMENTS,
  total_planned_duration_seconds: 1025,
};

// --- Show ---
// Dates relative to "now" so the demo always works regardless of current date.

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export const MOCK_SHOW: Show = {
  id: "show-1",
  name: "Quebonafide — Warszawa",
  status: "live",
  scheduled_start: minutesAgo(62),
  scheduled_end: minutesFromNow(60),
  curfew: minutesFromNow(90),
  actual_start: minutesAgo(60),
  venue: MOCK_VENUE,
  setlist: MOCK_SETLIST,
};

// --- Timeline (show in progress: 2 completed, 1 active, 2 planned) ---
// Timestamps relative to "now" so progress bar works in dev/demo.

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: "entry-1",
    segment_id: "seg-1",
    status: "completed",
    variant_used: "full",
    started_at: minutesAgo(10),
    ended_at: minutesAgo(6.3),
    planned_duration_seconds: 210,
    actual_duration_seconds: 222,
    delta_seconds: 12,
  },
  {
    id: "entry-2",
    segment_id: "seg-2",
    status: "completed",
    variant_used: "full",
    started_at: minutesAgo(6),
    ended_at: minutesAgo(2.7),
    planned_duration_seconds: 200,
    actual_duration_seconds: 200,
    delta_seconds: 0,
  },
  {
    id: "entry-3",
    segment_id: "seg-3",
    status: "active",
    variant_used: "full",
    started_at: minutesAgo(1),
    planned_duration_seconds: 180,
  },
  {
    id: "entry-4",
    segment_id: "seg-4",
    status: "planned",
    planned_duration_seconds: 240,
  },
  {
    id: "entry-5",
    segment_id: "seg-5",
    status: "planned",
    planned_duration_seconds: 195,
  },
];

// --- Engagement (current snapshot) ---

export const MOCK_ENGAGEMENT: EngagementMetric = {
  timestamp: "2026-05-15T20:11:20",
  score: 78,
  trend: "rising",
  event_type: "cheering",
};

// --- Recommendations ---

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    segment_id: "seg-3",
    segment_name: "Bubbletea",
    risk: "low",
    reason: "energy match",
    expected_engagement_delta: 5,
  },
  {
    segment_id: "seg-4",
    segment_name: "Jesień",
    risk: "medium",
    reason: "ballad contrast",
    expected_engagement_delta: -8,
  },
  {
    segment_id: "seg-5",
    segment_name: "Szubiepp",
    risk: "high",
    reason: "requires pyro setup",
    expected_engagement_delta: 15,
  },
];

// --- Recovery Scenarios ---

export const MOCK_RECOVERY_SCENARIOS: RecoveryScenario[] = [
  {
    id: "rec-1",
    description: "Skip Jesień",
    time_saved_seconds: 240,
    risk: "medium",
    impact: "usuwa ballad contrast",
    is_compound: false,
    actions: ["Skip segment #4 (Jesień)"],
    structured_actions: [{ type: "skip_segment", segment_id: "seg-4" }],
  },
  {
    id: "rec-2",
    description: "Short Bubbletea",
    time_saved_seconds: 50,
    risk: "low",
    impact: "minimalny wpływ na energię",
    is_compound: false,
    actions: ["Switch segment #3 to short variant"],
    structured_actions: [{ type: "switch_variant", segment_id: "seg-3", variant_type: "short" }],
  },
  {
    id: "rec-3",
    description: "Skip Jesień + Short Bubbletea",
    time_saved_seconds: 290,
    risk: "medium",
    impact: "usuwa balladę, skraca transition",
    is_compound: true,
    actions: ["Skip segment #4 (Jesień)", "Switch segment #3 to short variant"],
    structured_actions: [
      { type: "skip_segment", segment_id: "seg-4" },
      { type: "switch_variant", segment_id: "seg-3", variant_type: "short" },
    ],
  },
];

// --- Activity Log (initial entries for demo) ---

export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: "log-1",
    timestamp: minutesAgo(1),
    icon: "\u25B6",
    message: "Bubbletea start",
    reversible: false,
  },
  {
    id: "log-2",
    timestamp: minutesAgo(2.7),
    icon: "\u25A0",
    message: "Candy zako\u0144czony",
    reversible: false,
  },
  {
    id: "log-3",
    timestamp: minutesAgo(6),
    icon: "\u25B6",
    message: "Candy start",
    reversible: false,
  },
  {
    id: "log-4",
    timestamp: minutesAgo(6.3),
    icon: "\u25A0",
    message: "Tatua\u017C zako\u0144czony",
    reversible: false,
  },
  {
    id: "log-5",
    timestamp: minutesAgo(10),
    icon: "\u25B6",
    message: "Tatua\u017C start",
    reversible: false,
  },
  {
    id: "log-6",
    timestamp: minutesAgo(10),
    icon: "\u25B6",
    message: "Koncert rozpocz\u0119ty",
    reversible: false,
  },
];

// --- Engagement History (~60 points, 1 per minute, covering ~60 min from show start) ---
// Realistic energy curve: warm-up → first songs build → ballad dip → peak

const ENGAGEMENT_SCORES = [
  // 0-10 min: warm-up / DJ set, energy building slowly
  25, 28, 30, 33, 35, 38, 40, 42, 44, 45,
  // 10-20 min: crowd warming up, anticipation
  47, 48, 50, 52, 50, 53, 55, 54, 56, 58,
  // 20-30 min: first songs kick in, energy rising
  55, 58, 62, 60, 65, 68, 64, 67, 70, 66,
  // 30-40 min: high energy set, some fluctuation
  68, 72, 70, 74, 71, 75, 73, 70, 68, 65,
  // 40-50 min: ballad section dip, then recovery
  60, 55, 52, 50, 48, 52, 55, 58, 62, 65,
  // 50-60 min: building back up to current peak
  68, 70, 72, 70, 73, 75, 72, 74, 76, 78,
];

export const MOCK_ENGAGEMENT_HISTORY: TimestampedScore[] = ENGAGEMENT_SCORES.map((score, i) => ({
  timestamp: minutesAgo(ENGAGEMENT_SCORES.length - i),
  score,
}));
