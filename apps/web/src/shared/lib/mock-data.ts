import type { EngagementMetric } from "@/entities/engagement-metric";
import type { Recommendation, RecoveryScenario } from "@/entities/recommendation";
import type { Segment, Setlist, TimelineEntry } from "@/entities/segment";
import type { Show } from "@/entities/show";
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

export const MOCK_SHOW: Show = {
  id: "show-1",
  name: "Quebonafide — Warszawa 15.05.2026",
  status: "live",
  scheduled_start: "2026-05-15T20:00:00",
  curfew: "2026-05-15T23:00:00",
  actual_start: "2026-05-15T20:02:00",
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
    segment_id: "seg-3",
    status: "active",
    variant_used: "full",
    started_at: minutesAgo(1),
    planned_duration_seconds: 180,
  },
  {
    segment_id: "seg-4",
    status: "planned",
    planned_duration_seconds: 240,
  },
  {
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
  },
  {
    id: "rec-2",
    description: "Short Bubbletea",
    time_saved_seconds: 50,
    risk: "low",
    impact: "minimalny wpływ na energię",
    is_compound: false,
    actions: ["Switch segment #3 to short variant"],
  },
  {
    id: "rec-3",
    description: "Skip Jesień + Short Bubbletea",
    time_saved_seconds: 290,
    risk: "medium",
    impact: "usuwa balladę, skraca transition",
    is_compound: true,
    actions: ["Skip segment #4 (Jesień)", "Switch segment #3 to short variant"],
  },
];
