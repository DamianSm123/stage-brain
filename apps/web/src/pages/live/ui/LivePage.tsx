import { selectTotalDelta, useShowStore } from "@/entities/show";
import { formatDuration } from "@/shared/lib/formatTime";
import { ActivityLog } from "@/widgets/activity-log";
import { AdaptiveTimePanel } from "@/widgets/adaptive-time-panel";
import { DecisionPanel } from "@/widgets/decision-panel";
import { EngagementGauge } from "@/widgets/engagement-gauge";
import { NowPlaying } from "@/widgets/now-playing";
import { PreShowCenter } from "@/widgets/pre-show-center";
import { PreShowSidebar } from "@/widgets/pre-show-sidebar";
import { QuickTags } from "@/widgets/quick-tags";
import { SegmentTimeline } from "@/widgets/segment-timeline";
import { LiveTopBar } from "@/widgets/top-bar";

export function LivePage() {
  const show = useShowStore((s) => s.show);

  if (show.status === "setup") return <PreShowLayout />;
  if (show.status === "ended") return <EndedLayout />;
  return <LiveLayout />;
}

function LiveLayout() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <LiveTopBar />

      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        {/* Column 1: Segments Timeline */}
        <div className="flex flex-col overflow-hidden border-r border-border px-1.5 py-2">
          <SegmentTimeline />
        </div>

        {/* Column 2: Time + Now Playing + Engagement + Tags */}
        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <AdaptiveTimePanel />
          <NowPlaying />
          <EngagementGauge />
          <QuickTags />
        </div>

        {/* Column 3: Decision Panel */}
        <div className="flex flex-col gap-3 overflow-y-auto border-l border-border p-3">
          <DecisionPanel />
        </div>
      </div>

      <ActivityLog />
    </div>
  );
}

function PreShowLayout() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <LiveTopBar />

      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        {/* Column 1: Segments Timeline */}
        <div className="flex flex-col overflow-hidden border-r border-border px-1.5 py-2">
          <SegmentTimeline />
        </div>

        {/* Column 2: Countdown + Start button */}
        <div className="flex flex-col overflow-y-auto p-4">
          <PreShowCenter />
        </div>

        {/* Column 3: First segment + Summary */}
        <div className="flex flex-col gap-3 overflow-y-auto border-l border-border p-3">
          <PreShowSidebar />
        </div>
      </div>
    </div>
  );
}

function EndedLayout() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const totalDelta = selectTotalDelta(show, timeline, Date.now());

  const sign = totalDelta > 0 ? "+" : "";
  const deltaLabel = `${sign}${formatDuration(Math.abs(totalDelta))}`;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <span className="text-4xl font-bold">KONCERT ZAKOŃCZONY</span>
      <span className="text-2xl font-mono tabular-nums text-muted-foreground">
        Delta: {deltaLabel}
      </span>
    </div>
  );
}
