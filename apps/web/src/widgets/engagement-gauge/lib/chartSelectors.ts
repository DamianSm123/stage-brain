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

// Candidate intervals in ascending order (ms).
// computeRoundTicks picks the smallest one that produces <= MAX_TICKS.
const TICK_INTERVALS = [2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, 60 * MIN];
const MAX_TICKS = 10;

/**
 * Generate round clock-time ticks for a visible time window.
 * Picks the smallest interval that fits <= MAX_TICKS, then snaps to
 * round multiples (e.g. :00, :10, :20, :30).
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

const ZOOM_FACTOR = 2;
export const MIN_WINDOW_MS = 3 * MIN;

/**
 * Compute a new visible domain after zoom in/out.
 * Anchor ratio is based on "now"'s position in the FULL concert domain,
 * so the chart fills naturally as the concert progresses.
 */
export function zoomDomain(
  current: [number, number],
  fullDomain: [number, number],
  anchor: number,
  direction: 1 | -1,
): [number, number] {
  const currentSpan = current[1] - current[0];
  const fullSpan = fullDomain[1] - fullDomain[0];
  const newSpan = direction === 1 ? currentSpan / ZOOM_FACTOR : currentSpan * ZOOM_FACTOR;

  // Clamp span; snap to full when close (within 5%)
  const clampedSpan = Math.max(MIN_WINDOW_MS, Math.min(newSpan, fullSpan));
  if (clampedSpan >= fullSpan * 0.95) {
    return [fullDomain[0], fullDomain[1]];
  }

  // Anchor ratio based on full concert domain — natural position
  const anchorRatio = Math.max(0, Math.min(1, (anchor - fullDomain[0]) / fullSpan));
  let newStart = anchor - anchorRatio * clampedSpan;
  let newEnd = newStart + clampedSpan;

  // Clamp to full domain
  if (newStart < fullDomain[0]) {
    newStart = fullDomain[0];
    newEnd = newStart + clampedSpan;
  }
  if (newEnd > fullDomain[1]) {
    newEnd = fullDomain[1];
    newStart = newEnd - clampedSpan;
  }

  return [newStart, newEnd];
}
