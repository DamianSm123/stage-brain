import { create } from "zustand";
import type { EngagementMetric, TimestampedScore } from "@/entities/engagement-metric";
import type { OperatorTag } from "@/entities/operator-tag";
import type { Recommendation, RecoveryScenario } from "@/entities/recommendation";
import type { SegmentStatus, TimelineEntry } from "@/entities/segment";
import {
  MOCK_ACTIVITY_LOG,
  MOCK_ENGAGEMENT,
  MOCK_ENGAGEMENT_HISTORY,
  MOCK_RECOMMENDATIONS,
  MOCK_RECOVERY_SCENARIOS,
  MOCK_SETLIST,
  MOCK_SHOW,
  MOCK_TIMELINE,
  MOCK_VENUE,
} from "@/shared/lib/mock-data";
import type { ActivityLogEntry, DashboardShow, Show, ShowStatus, UndoSnapshot } from "./types";

function createLogEntry(
  icon: string,
  message: string,
  reversible = false,
  undoSnapshot?: UndoSnapshot,
): ActivityLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    icon,
    message,
    reversible,
    undoSnapshot,
  };
}

interface ShowState {
  show: Show;
  timeline: TimelineEntry[];
  engagement: EngagementMetric;
  recommendations: Recommendation[];
  recoveryScenarios: RecoveryScenario[];
  tags: OperatorTag[];
  activityLog: ActivityLogEntry[];
  holdStartedAt: string | null;
  engagementHistory: TimestampedScore[];

  pushEngagement: (point: TimestampedScore) => void;
  setShowStatus: (status: ShowStatus) => void;
  setSegmentStatus: (entryId: string, status: SegmentStatus) => void;
  setVariant: (entryId: string, variantType: string) => void;
  replaySegment: (segmentId: string, variantType?: string) => void;
  addTag: (tag: OperatorTag) => void;
  initializeShow: (show: Show, timeline: TimelineEntry[]) => void;
  startShow: (dashboardShow: DashboardShow) => void;
  beginPerformance: () => void;
  applyRecoveryScenario: (scenarioId: string) => void;
  acceptRecommendation: (segmentId: string) => void;
  holdShow: () => void;
  resumeShow: () => void;
  endShow: () => void;
  reorderSegments: (fromId: string, toId: string) => void;
  seekSegment: (segmentId: string, newElapsedSeconds: number) => void;
  seekSegmentCommit: (segmentId: string, newElapsedSeconds: number) => void;
  undoLastAction: () => void;
  logActivity: (entry: ActivityLogEntry) => void;
}

export const useShowStore = create<ShowState>((set, get) => ({
  show: MOCK_SHOW,
  timeline: MOCK_TIMELINE,
  engagement: MOCK_ENGAGEMENT,
  recommendations: MOCK_RECOMMENDATIONS,
  recoveryScenarios: MOCK_RECOVERY_SCENARIOS,
  tags: [],
  activityLog: MOCK_ACTIVITY_LOG,
  holdStartedAt: null,
  engagementHistory: MOCK_ENGAGEMENT_HISTORY,

  pushEngagement: (point) =>
    set((state) => {
      const history = [...state.engagementHistory, point];

      // Derive trend from last 10 points
      let trend = state.engagement.trend;
      if (history.length >= 6) {
        const recent5 = history.slice(-5);
        const prev5 = history.slice(-10, -5);
        const avgRecent = recent5.reduce((sum, p) => sum + p.score, 0) / recent5.length;
        const avgPrev = prev5.reduce((sum, p) => sum + p.score, 0) / prev5.length;
        const diff = avgRecent - avgPrev;
        trend = diff > 3 ? "rising" : diff < -3 ? "falling" : "stable";
      }

      return {
        engagementHistory: history,
        engagement: {
          ...state.engagement,
          score: point.score,
          timestamp: point.timestamp,
          trend,
        },
      };
    }),

  setShowStatus: (status) =>
    set((state) => ({
      show: { ...state.show, status },
    })),

  setSegmentStatus: (entryId, status) =>
    set((state) => {
      const entry = state.timeline.find((e) => e.id === entryId);
      if (!entry) return state;

      const segment = state.show.setlist.segments.find((s) => s.id === entry.segment_id);
      const segmentName = segment?.name ?? entry.segment_id;
      const replayLabel = entry.is_replay ? " (powtórka)" : "";

      let logEntry: ActivityLogEntry | null = null;
      if (status === "active") {
        logEntry = createLogEntry("\u25B6", `${segmentName}${replayLabel} start`);
      } else if (status === "completed") {
        logEntry = createLogEntry("\u25A0", `${segmentName}${replayLabel} zako\u0144czony`);
      } else if (status === "skipped") {
        logEntry = createLogEntry("\u23ED", `${segmentName}${replayLabel} pomini\u0119ty`, true, {
          timeline: state.timeline,
        });
      }

      return {
        timeline: state.timeline.map((e) => {
          if (e.id !== entryId) return e;

          const now = new Date().toISOString();
          const updated: TimelineEntry = { ...e, status };

          if (status === "active") {
            updated.started_at = now;
          }

          if (status === "completed" || status === "skipped") {
            updated.ended_at = now;
            if (e.started_at) {
              updated.actual_duration_seconds = Math.floor(
                (Date.now() - new Date(e.started_at).getTime()) / 1000,
              );
              updated.delta_seconds = updated.actual_duration_seconds - e.planned_duration_seconds;
            } else {
              updated.actual_duration_seconds = 0;
              updated.delta_seconds = -e.planned_duration_seconds;
            }
          }

          return updated;
        }),
        activityLog: logEntry ? [logEntry, ...state.activityLog] : state.activityLog,
      };
    }),

  setVariant: (entryId, variantType) =>
    set((state) => {
      const entry = state.timeline.find((e) => e.id === entryId);
      if (!entry) return state;

      const segment = state.show.setlist.segments.find((s) => s.id === entry.segment_id);
      const variant = segment?.variants.find((v) => v.variant_type === variantType);
      if (!variant) return state;

      const segmentName = segment?.name ?? entry.segment_id;
      const variantLabels: Record<string, string> = {
        full: "pełna",
        short: "krótka",
        extended: "rozszerzona",
        acoustic: "akustyczna",
      };
      const label = variantLabels[variantType] ?? variantType;

      return {
        timeline: state.timeline.map((e) =>
          e.id === entryId
            ? {
                ...e,
                variant_used: variantType,
                planned_duration_seconds: variant.duration_seconds,
              }
            : e,
        ),
        activityLog: [
          createLogEntry("\u2194", `${segmentName} \u2192 ${label}`, true, {
            timeline: state.timeline,
          }),
          ...state.activityLog,
        ],
      };
    }),

  replaySegment: (segmentId, variantType) =>
    set((state) => {
      const segment = state.show.setlist.segments.find((s) => s.id === segmentId);
      if (!segment) return state;

      const chosenVariant = variantType
        ? segment.variants.find((v) => v.variant_type === variantType)
        : undefined;
      const defaultVariant =
        chosenVariant ??
        segment.variants.find((v) => v.variant_type === "full") ??
        segment.variants[0];
      if (!defaultVariant) return state;

      const newEntry: TimelineEntry = {
        id: crypto.randomUUID(),
        segment_id: segmentId,
        status: "planned",
        variant_used: defaultVariant.variant_type,
        planned_duration_seconds: defaultVariant.duration_seconds,
        is_replay: true,
      };

      // Insert after the active segment (or at end if none active)
      const activeIdx = state.timeline.findIndex((e) => e.status === "active");
      const insertIdx = activeIdx !== -1 ? activeIdx + 1 : state.timeline.length;
      const newTimeline = [...state.timeline];
      newTimeline.splice(insertIdx, 0, newEntry);

      return {
        timeline: newTimeline,
        activityLog: [
          createLogEntry("\u21BB", `Powtórka: ${segment.name}`, true, {
            timeline: state.timeline,
          }),
          ...state.activityLog,
        ],
      };
    }),

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag],
      activityLog: [
        createLogEntry(tag.tag.split(" ").pop() ?? "\u2606", `Tag: ${tag.custom_text ?? tag.tag}`),
        ...state.activityLog,
      ],
    })),

  initializeShow: (show, timeline) =>
    set({
      show,
      timeline,
      tags: [],
      activityLog: [],
    }),

  startShow: (dashboardShow) => {
    const toISO = (date: string, time: string): string => {
      if (!date || !time) return new Date().toISOString();
      return new Date(`${date}T${time}`).toISOString();
    };

    const venue = dashboardShow.venue
      ? {
          id: dashboardShow.id,
          name: dashboardShow.venue.name,
          city: dashboardShow.venue.city,
          type: dashboardShow.venue.type,
          capacity: dashboardShow.venue.capacity,
        }
      : MOCK_VENUE;

    const setlist = MOCK_SETLIST;

    const show: Show = {
      id: dashboardShow.id,
      name: dashboardShow.name,
      status: "setup",
      scheduled_start: toISO(dashboardShow.date, dashboardShow.startTime),
      scheduled_end: toISO(dashboardShow.date, dashboardShow.endTime),
      curfew: toISO(dashboardShow.date, dashboardShow.curfew),
      venue,
      setlist,
    };

    const timeline: TimelineEntry[] = setlist.segments.map((seg) => ({
      id: crypto.randomUUID(),
      segment_id: seg.id,
      status: "planned" as const,
      planned_duration_seconds:
        seg.variants.find((v) => v.variant_type === "full")?.duration_seconds ??
        seg.variants[0]?.duration_seconds ??
        0,
    }));

    set({
      show,
      timeline,
      engagement: MOCK_ENGAGEMENT,
      recommendations: [],
      recoveryScenarios: [],
      tags: [],
      activityLog: [],
      holdStartedAt: null,
      engagementHistory: [],
    });
  },

  beginPerformance: () =>
    set((state) => ({
      show: {
        ...state.show,
        status: "live" as const,
        actual_start: new Date().toISOString(),
      },
      activityLog: [createLogEntry("\u25B6", "Koncert rozpocz\u0119ty"), ...state.activityLog],
    })),

  holdShow: () =>
    set((state) => ({
      show: { ...state.show, status: "paused" as const },
      holdStartedAt: new Date().toISOString(),
      activityLog: [createLogEntry("\u23F8", "Show wstrzymany"), ...state.activityLog],
    })),

  resumeShow: () =>
    set((state) => ({
      show: { ...state.show, status: "live" as const },
      holdStartedAt: null,
      activityLog: [createLogEntry("\u25B6", "Show wznowiony"), ...state.activityLog],
    })),

  endShow: () =>
    set((state) => ({
      show: { ...state.show, status: "ended" as const },
      activityLog: [createLogEntry("\u25A0", "Koncert zako\u0144czony"), ...state.activityLog],
    })),

  reorderSegments: (fromEntryId, toEntryId) =>
    set((state) => {
      const segments = state.show.setlist.segments;
      const timeline = [...state.timeline];

      const fromIdx = timeline.findIndex((e) => e.id === fromEntryId);
      const toIdx = timeline.findIndex((e) => e.id === toEntryId);
      if (fromIdx === -1 || toIdx === -1) return state;

      const [moved] = timeline.splice(fromIdx, 1);
      timeline.splice(toIdx, 0, moved);

      const fromSeg = segments.find((s) => s.id === moved.segment_id);
      const fromName = fromSeg?.name ?? moved.segment_id;
      const oldPos = fromIdx + 1;
      const newPos = toIdx + 1;

      return {
        timeline,
        activityLog: [
          createLogEntry("\u2195", `${fromName} przeniesiony: ${oldPos} \u2192 ${newPos}`, true, {
            timeline: state.timeline,
          }),
          ...state.activityLog,
        ],
      };
    }),

  seekSegment: (segmentId, newElapsedSeconds) =>
    set((state) => {
      const newStartedAt = new Date(Date.now() - newElapsedSeconds * 1000).toISOString();

      return {
        timeline: state.timeline.map((entry) => {
          if (entry.segment_id !== segmentId) return entry;
          if (entry.status !== "active") return entry;
          return { ...entry, started_at: newStartedAt };
        }),
      };
    }),

  seekSegmentCommit: (segmentId, newElapsedSeconds) =>
    set((state) => {
      const segment = state.show.setlist.segments.find((s) => s.id === segmentId);
      const segmentName = segment?.name ?? segmentId;
      const mins = Math.floor(newElapsedSeconds / 60);
      const secs = newElapsedSeconds % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

      return {
        activityLog: [
          createLogEntry("\u23E9", `${segmentName} przewini\u0119ta do ${timeStr}`),
          ...state.activityLog,
        ],
      };
    }),

  undoLastAction: () => {
    const state = get();
    const lastReversible = state.activityLog.find((e) => e.reversible);
    if (!lastReversible?.undoSnapshot) return;

    const snapshot = lastReversible.undoSnapshot;

    set({
      timeline: snapshot.timeline,
      ...(snapshot.recommendations !== undefined && { recommendations: snapshot.recommendations }),
      ...(snapshot.recoveryScenarios !== undefined && {
        recoveryScenarios: snapshot.recoveryScenarios,
      }),
      activityLog: [
        createLogEntry("\u21A9", `Cofni\u0119to: ${lastReversible.message}`),
        ...state.activityLog.map((e) =>
          e.id === lastReversible.id ? { ...e, reversible: false, undoSnapshot: undefined } : e,
        ),
      ],
    });
  },

  logActivity: (entry) =>
    set((state) => ({
      activityLog: [entry, ...state.activityLog],
    })),

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
        activityLog: [
          createLogEntry("\u2699", `Recovery: ${scenario.description}`, true, {
            timeline: state.timeline,
            recoveryScenarios: state.recoveryScenarios,
          }),
          ...state.activityLog,
        ],
      };
    }),

  acceptRecommendation: (segmentId) =>
    set((state) => {
      const rec = state.recommendations.find((r) => r.segment_id === segmentId);
      const segmentName = rec?.segment_name ?? segmentId;

      const timeline = [...state.timeline];

      // Find the active segment and the approved entry
      const activeIdx = timeline.findIndex((e) => e.status === "active");
      const approvedIdx = timeline.findIndex(
        (e) => e.segment_id === segmentId && e.status === "planned",
      );

      if (approvedIdx === -1) return state;

      // Move approved entry to right after active (or to front if no active)
      const insertIdx = activeIdx !== -1 ? activeIdx + 1 : 0;

      if (approvedIdx !== insertIdx) {
        const [moved] = timeline.splice(approvedIdx, 1);
        // Adjust insert index if the removed item was before the target
        const adjustedIdx = approvedIdx < insertIdx ? insertIdx - 1 : insertIdx;
        timeline.splice(adjustedIdx, 0, moved);
      }

      return {
        timeline,
        recommendations: state.recommendations.filter((r) => r.segment_id !== segmentId),
        activityLog: [
          createLogEntry("\u2713", `Następna: ${segmentName}`, true, {
            timeline: state.timeline,
            recommendations: state.recommendations,
          }),
          ...state.activityLog,
        ],
      };
    }),
}));
