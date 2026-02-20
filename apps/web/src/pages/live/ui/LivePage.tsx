import { CurfewPanel } from "@/widgets/curfew-panel";
import { EngagementGauge } from "@/widgets/engagement-gauge";
import { NowPlaying } from "@/widgets/now-playing";
import { QuickTags } from "@/widgets/quick-tags";
import { RecommendationPanel } from "@/widgets/recommendation-panel";
import { RecoveryScenarios } from "@/widgets/recovery-scenarios";
import { SegmentTimeline } from "@/widgets/segment-timeline";
import { TopBar } from "@/widgets/top-bar";

export function LivePage() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top Bar — always visible: status, clock, curfew, delta */}
      <TopBar />

      {/* 3-column Command Center layout */}
      <div className="grid flex-1 grid-cols-[260px_1fr_280px] overflow-hidden">
        {/* Column 1: Segments Timeline */}
        <div className="flex flex-col overflow-hidden border-r border-border p-3">
          <SegmentTimeline />
        </div>

        {/* Column 2: Curfew + Now Playing + Engagement + Quick Tags */}
        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          <CurfewPanel />
          <NowPlaying />
          <EngagementGauge />
          <QuickTags />
        </div>

        {/* Column 3: Recommendations + Recovery Scenarios */}
        <div className="flex flex-col gap-3 overflow-y-auto border-l border-border p-3">
          <RecommendationPanel />
          <RecoveryScenarios />
        </div>
      </div>
    </div>
  );
}
