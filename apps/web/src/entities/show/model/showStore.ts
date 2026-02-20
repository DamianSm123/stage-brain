import { create } from "zustand";
import type { EngagementMetric } from "@/entities/engagement-metric";
import type { OperatorTag } from "@/entities/operator-tag";
import type { Recommendation, RecoveryScenario } from "@/entities/recommendation";
import type { SegmentStatus, TimelineEntry } from "@/entities/segment";
import {
  MOCK_ENGAGEMENT,
  MOCK_RECOMMENDATIONS,
  MOCK_RECOVERY_SCENARIOS,
  MOCK_SHOW,
  MOCK_TIMELINE,
} from "@/shared/lib/mock-data";
import type { Show, ShowStatus } from "./types";

interface ShowState {
  show: Show;
  timeline: TimelineEntry[];
  engagement: EngagementMetric;
  recommendations: Recommendation[];
  recoveryScenarios: RecoveryScenario[];
  tags: OperatorTag[];

  setShowStatus: (status: ShowStatus) => void;
  setSegmentStatus: (segmentId: string, status: SegmentStatus) => void;
  addTag: (tag: OperatorTag) => void;
  initializeShow: (show: Show, timeline: TimelineEntry[]) => void;
  applyRecoveryScenario: (scenarioId: string) => void;
  acceptRecommendation: (segmentId: string) => void;
}

export const useShowStore = create<ShowState>((set) => ({
  show: MOCK_SHOW,
  timeline: MOCK_TIMELINE,
  engagement: MOCK_ENGAGEMENT,
  recommendations: MOCK_RECOMMENDATIONS,
  recoveryScenarios: MOCK_RECOVERY_SCENARIOS,
  tags: [],

  setShowStatus: (status) =>
    set((state) => ({
      show: { ...state.show, status },
    })),

  setSegmentStatus: (segmentId, status) =>
    set((state) => ({
      timeline: state.timeline.map((entry) => {
        if (entry.segment_id !== segmentId) return entry;

        const now = new Date().toISOString();
        const updated: TimelineEntry = { ...entry, status };

        if (status === "active") {
          updated.started_at = now;
        }

        if (status === "completed" || status === "skipped") {
          updated.ended_at = now;
          if (entry.started_at) {
            updated.actual_duration_seconds = Math.floor(
              (Date.now() - new Date(entry.started_at).getTime()) / 1000,
            );
            updated.delta_seconds =
              updated.actual_duration_seconds - entry.planned_duration_seconds;
          } else {
            updated.actual_duration_seconds = 0;
            updated.delta_seconds = -entry.planned_duration_seconds;
          }
        }

        return updated;
      }),
    })),

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag],
    })),

  initializeShow: (show, timeline) =>
    set({
      show,
      timeline,
      tags: [],
    }),

  applyRecoveryScenario: (scenarioId) =>
    set((state) => {
      const scenario = state.recoveryScenarios.find((s) => s.id === scenarioId);
      if (!scenario) return state;

      const segments = state.show.setlist.segments;
      let updatedTimeline = [...state.timeline];

      for (const action of scenario.structured_actions) {
        if (action.type === "skip_segment") {
          updatedTimeline = updatedTimeline.map((entry) => {
            if (entry.segment_id !== action.segment_id) return entry;
            if (entry.status !== "planned") return entry;
            return {
              ...entry,
              status: "skipped" as const,
              ended_at: new Date().toISOString(),
              actual_duration_seconds: 0,
              delta_seconds: -entry.planned_duration_seconds,
            };
          });
        }

        if (action.type === "switch_variant" && action.variant_type) {
          const segment = segments.find((s) => s.id === action.segment_id);
          const variant = segment?.variants.find((v) => v.variant_type === action.variant_type);
          if (variant) {
            updatedTimeline = updatedTimeline.map((entry) => {
              if (entry.segment_id !== action.segment_id) return entry;
              return {
                ...entry,
                variant_used: action.variant_type,
                planned_duration_seconds: variant.duration_seconds,
              };
            });
          }
        }
      }

      return {
        timeline: updatedTimeline,
        recoveryScenarios: state.recoveryScenarios.filter((s) => s.id !== scenarioId),
      };
    }),

  acceptRecommendation: (segmentId) =>
    set((state) => {
      const now = new Date().toISOString();
      const nowMs = Date.now();

      const updatedTimeline = state.timeline.map((entry) => {
        // Complete the currently active segment
        if (entry.status === "active") {
          const actualDuration = entry.started_at
            ? Math.floor((nowMs - new Date(entry.started_at).getTime()) / 1000)
            : 0;
          return {
            ...entry,
            status: "completed" as const,
            ended_at: now,
            actual_duration_seconds: actualDuration,
            delta_seconds: actualDuration - entry.planned_duration_seconds,
          };
        }
        // Activate the recommended segment
        if (entry.segment_id === segmentId && entry.status === "planned") {
          return {
            ...entry,
            status: "active" as const,
            started_at: now,
          };
        }
        return entry;
      });

      return {
        timeline: updatedTimeline,
        recommendations: state.recommendations.filter((r) => r.segment_id !== segmentId),
      };
    }),
}));
