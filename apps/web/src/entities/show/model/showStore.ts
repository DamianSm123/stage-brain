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
      timeline: state.timeline.map((entry) =>
        entry.segment_id === segmentId ? { ...entry, status } : entry,
      ),
    })),

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag],
    })),
}));
