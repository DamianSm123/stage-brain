import type { TimelineEntry } from "@/entities/segment";
import type { DashboardShow, Show, ShowTimeState } from "./types";

export type ShowUrgency = "imminent" | "soon" | "today";

export function getShowUrgency(show: DashboardShow): ShowUrgency | null {
  if (show.status !== "GOTOWY") return null;
  if (!show.date || !show.startTime) return null;

  const showDateTime = new Date(`${show.date}T${show.startTime}`);
  if (Number.isNaN(showDateTime.getTime())) return null;

  const now = new Date();
  const diffMs = showDateTime.getTime() - now.getTime();

  if (diffMs < 0) return null;

  const diffMin = diffMs / 60_000;
  if (diffMin <= 15) return "imminent";
  if (diffMin <= 60) return "soon";

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  if (showDateTime >= todayStart && showDateTime < todayEnd) return "today";

  return null;
}

export function findConflictingShow(
  date: string,
  startTime: string,
  excludeId: string,
  shows: DashboardShow[],
): DashboardShow | null {
  if (!date || !startTime) return null;

  return (
    shows.find(
      (s) =>
        s.id !== excludeId &&
        s.status !== "ZAKONCZONY" &&
        s.date === date &&
        s.startTime === startTime,
    ) ?? null
  );
}

export function selectTotalDelta(show: Show, timeline: TimelineEntry[], now: number): number {
  // For ended shows: use frozen deltas from completed segments
  if (show.status === "ended") {
    let delta = 0;
    for (const entry of timeline) {
      if (entry.status === "completed" || entry.status === "skipped") {
        delta += entry.delta_seconds ?? 0;
      }
    }
    return delta;
  }

  // For live shows: projected end vs scheduled end
  const scheduledEndMs = show.scheduled_end ? new Date(show.scheduled_end).getTime() : 0;
  if (!scheduledEndMs) return 0;

  const projectedEnd = selectProjectedEnd(timeline, now);
  return Math.floor((projectedEnd.getTime() - scheduledEndMs) / 1000);
}

export function selectProjectedEnd(timeline: TimelineEntry[], now: number): Date {
  let remainingSeconds = 0;

  const activeEntry = timeline.find((e) => e.status === "active");
  if (activeEntry?.started_at) {
    const elapsed = Math.floor((now - new Date(activeEntry.started_at).getTime()) / 1000);
    remainingSeconds += Math.max(0, activeEntry.planned_duration_seconds - elapsed);
  }

  for (const entry of timeline) {
    if (entry.status === "planned") {
      remainingSeconds += entry.planned_duration_seconds;
    }
  }

  return new Date(now + remainingSeconds * 1000);
}

export function selectBufferToCurfew(show: Show, timeline: TimelineEntry[], now: number): number {
  const curfewMs = new Date(show.curfew).getTime();
  const projectedEndMs = selectProjectedEnd(timeline, now).getTime();
  return Math.floor((curfewMs - projectedEndMs) / 1000);
}

export function selectShowTimeState(
  show: Show,
  timeline: TimelineEntry[],
  now: number,
): ShowTimeState {
  if (show.status === "setup") return "pre-show";
  if (show.status === "ended") return "ended";

  const totalDelta = selectTotalDelta(show, timeline, now);
  const bufferSeconds = selectBufferToCurfew(show, timeline, now);

  if (totalDelta <= 0) return "on-time";
  if (bufferSeconds <= 0) return "buffer-eaten";
  return "delayed";
}

export function selectActiveSegment(timeline: TimelineEntry[]): TimelineEntry | undefined {
  return timeline.find((e) => e.status === "active");
}

export function selectNextPlannedSegment(timeline: TimelineEntry[]): TimelineEntry | undefined {
  return timeline.find((e) => e.status === "planned");
}

export function selectCompletedCount(timeline: TimelineEntry[]): number {
  return timeline.filter((e) => e.status === "completed" || e.status === "skipped").length;
}

export function selectIsSetlistComplete(timeline: TimelineEntry[]): boolean {
  return (
    timeline.length > 0 && timeline.every((e) => e.status === "completed" || e.status === "skipped")
  );
}

export function selectIsInDecisionWindow(timeline: TimelineEntry[], now: number): boolean {
  const active = selectActiveSegment(timeline);
  if (!active?.started_at) return false;

  const elapsed = Math.floor((now - new Date(active.started_at).getTime()) / 1000);
  const remaining = active.planned_duration_seconds - elapsed;
  return remaining <= 30 && remaining > 0;
}
