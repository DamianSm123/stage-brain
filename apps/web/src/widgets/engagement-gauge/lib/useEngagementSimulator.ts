import { useEffect, useRef } from "react";
import { useShowStore } from "@/entities/show";

const INTERVAL_MS = 1000;
const SMOOTHING = 0.06;
const NOISE_AMP = 4;
const MIN_SCORE = 5;
const MAX_SCORE = 100;
const DEFAULT_TARGET = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Engagement simulator — produces smooth, continuously flowing data for the prototype.
 * Runs only when show.status === "live". Pushes a new TimestampedScore every 1.5s
 * using a smoothed random walk toward the active segment's expected_energy.
 */
export function useEngagementSimulator(): void {
  const prevScoreRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const state = useShowStore.getState();

      if (state.show.status !== "live") return;

      // Find active segment to get target energy
      const activeEntry = state.timeline.find((e) => e.status === "active");
      const activeSegment = activeEntry
        ? state.show.setlist.segments.find((s) => s.id === activeEntry.segment_id)
        : null;

      const target = activeSegment ? activeSegment.expected_energy * 100 : DEFAULT_TARGET;

      // Seed from last known score
      const lastScore =
        prevScoreRef.current ??
        (state.engagementHistory.length > 0
          ? state.engagementHistory[state.engagementHistory.length - 1].score
          : target);

      const nextScore = clamp(
        lastScore + (target - lastScore) * SMOOTHING + (Math.random() - 0.5) * NOISE_AMP,
        MIN_SCORE,
        MAX_SCORE,
      );

      const rounded = Math.round(nextScore);
      prevScoreRef.current = rounded;

      state.pushEngagement({
        timestamp: new Date().toISOString(),
        score: rounded,
      });
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, []);
}
