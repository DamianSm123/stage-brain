import type { ChartAnnotation, TimestampedScore } from "@/entities/engagement-metric";
import type { OperatorTag } from "@/entities/operator-tag";
import type { TimelineEntry } from "@/entities/segment";
import type { Show } from "@/entities/show";

export interface ChartPoint {
  time: number; // epoch ms
  score: number;
}

export interface SegmentBoundary {
  time: number; // epoch ms
  segmentName: string;
}

/**
 * Find which segment is playing at a given timestamp.
 * Returns the segment whose started_at is ≤ time (the latest one before/at time).
 */
export function getSegmentAtTime(time: number, boundaries: SegmentBoundary[]): string | null {
  let result: string | null = null;
  for (const b of boundaries) {
    if (b.time <= time) {
      result = b.segmentName;
    } else {
      break;
    }
  }
  return result;
}

export function toChartPoints(history: TimestampedScore[]): ChartPoint[] {
  return history.map((h) => ({
    time: new Date(h.timestamp).getTime(),
    score: h.score,
  }));
}

export function deriveSegmentBoundaries(
  timeline: TimelineEntry[],
  segments: { id: string; name: string }[],
): SegmentBoundary[] {
  const nameMap = new Map(segments.map((s) => [s.id, s.name]));
  return timeline
    .filter((e): e is TimelineEntry & { started_at: string } => Boolean(e.started_at))
    .map((e) => ({
      time: new Date(e.started_at).getTime(),
      segmentName: nameMap.get(e.segment_id) ?? e.segment_id,
    }));
}

export function deriveTagAnnotations(tags: OperatorTag[]): ChartAnnotation[] {
  return tags.map((t) => {
    // QuickTags stores tags as "Peak ⚡", "Low energy ↓", etc.
    // Extract the icon as the last space-separated token.
    const icon = t.tag.split(" ").pop() ?? "●";

    return {
      id: t.id,
      type: "marker" as const,
      timestamp: t.timestamp,
      label: t.custom_text ?? t.tag,
      icon,
    };
  });
}

/**
 * Find tags whose timestamp falls within ±tolerance of the given time.
 */
export function getTagsAtTime(
  time: number,
  annotations: ChartAnnotation[],
  toleranceMs = 5_000,
): ChartAnnotation[] {
  return annotations.filter((a) => {
    const t = new Date(a.timestamp).getTime();
    return Math.abs(t - time) <= toleranceMs;
  });
}

export function computeTimeDomain(show: Show): [number, number] {
  const start = show.actual_start
    ? new Date(show.actual_start).getTime()
    : new Date(show.scheduled_start).getTime();
  const end = show.scheduled_end
    ? new Date(show.scheduled_end).getTime()
    : start + 2 * 60 * 60 * 1000; // fallback: +2h
  return [start, end];
}

const MIN = 60_000;
const SEC = 1_000;

// Candidate intervals in ascending order (ms).
// computeRoundTicks picks the smallest one that produces <= MAX_TICKS.
const TICK_INTERVALS = [
  15 * SEC,
  30 * SEC,
  1 * MIN,
  2 * MIN,
  5 * MIN,
  10 * MIN,
  15 * MIN,
  30 * MIN,
  60 * MIN,
];
const MAX_TICKS = 10;

/**
 * Generate round clock-time ticks for a visible time window.
 * Picks the smallest interval that fits <= MAX_TICKS, then snaps to
 * round multiples (e.g. :00, :15, :30, :45).
 */
export function computeRoundTicks(visibleStart: number, visibleEnd: number): number[] {
  const duration = visibleEnd - visibleStart;

  // Find smallest interval that won't exceed MAX_TICKS
  let interval = TICK_INTERVALS[TICK_INTERVALS.length - 1];
  for (const candidate of TICK_INTERVALS) {
    if (Math.floor(duration / candidate) <= MAX_TICKS) {
      interval = candidate;
      break;
    }
  }

  // Snap first tick to the next round multiple of interval
  const firstTick = Math.ceil(visibleStart / interval) * interval;

  const ticks: number[] = [];
  for (let t = firstTick; t <= visibleEnd; t += interval) {
    ticks.push(t);
  }
  return ticks;
}
