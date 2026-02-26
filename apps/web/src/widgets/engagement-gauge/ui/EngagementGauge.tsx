import { memo, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartAnnotation, EngagementTrend } from "@/entities/engagement-metric";
import { useShowStore } from "@/entities/show";
import { formatTime } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { type ChartConfig, ChartContainer } from "@/shared/ui/chart";
import {
  type ChartPoint,
  computeRoundTicks,
  computeTimeDomain,
  deriveSegmentBoundaries,
  deriveTagAnnotations,
  getSegmentAtTime,
  getTagsAtTime,
  type SegmentBoundary,
  toChartPoints,
} from "../lib/chartSelectors";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 5 * 60_000; // 5-minute sliding window
const DETAIL_BUFFER_MS = 30_000; // extra data before window edge for smooth line entry

/* ------------------------------------------------------------------ */
/*  Stable object refs (avoids re-alloc every render)                  */
/* ------------------------------------------------------------------ */

const DETAIL_MARGIN = { top: 8, right: 4, bottom: 0, left: 4 } as const;
const MINIMAP_MARGIN = { top: 0, right: 4, bottom: 0, left: 4 } as const;
const Y_DOMAIN: [number, number] = [0, 100];
const TICK_STYLE = { fontSize: 11, fill: "rgba(255,255,255,0.6)" } as const;
const AXIS_LINE_STYLE = { stroke: "rgba(255,255,255,0.1)" } as const;
const ACTIVE_DOT = { r: 3, fill: "white" } as const;
const CHART_CONFIG = {
  score: { label: "Energia", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score < 30) return "text-red-500";
  if (score < 60) return "text-yellow-500";
  return "text-green-500";
}

function getGradientId(score: number): string {
  if (score < 30) return "fillRed";
  if (score < 60) return "fillYellow";
  return "fillGreen";
}

function getStrokeColor(score: number): string {
  if (score < 30) return "var(--color-red-500, #ef4444)";
  if (score < 60) return "var(--color-yellow-500, #eab308)";
  return "var(--color-green-500, #22c55e)";
}

function getTrendArrow(trend: EngagementTrend): string {
  switch (trend) {
    case "rising":
      return "\u2191";
    case "stable":
      return "\u2192";
    case "falling":
      return "\u2193";
  }
}

function getTrendLabel(trend: EngagementTrend): string {
  switch (trend) {
    case "rising":
      return "ro\u015bnie";
    case "stable":
      return "stabilna";
    case "falling":
      return "spada";
  }
}

function getTrendClass(trend: EngagementTrend): string {
  switch (trend) {
    case "rising":
      return "text-green-500";
    case "stable":
      return "text-yellow-500";
    case "falling":
      return "text-red-500";
  }
}

function formatTickTime(epoch: number): string {
  return formatTime(new Date(epoch));
}

/* ------------------------------------------------------------------ */
/*  Smooth ticker for detail chart domain                              */
/* ------------------------------------------------------------------ */

function useTickingNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Filter points to visible window + buffer (reduces SVG nodes). */
function filterVisible(points: ChartPoint[], start: number, end: number): ChartPoint[] {
  const bufStart = start - DETAIL_BUFFER_MS;
  return points.filter((p) => p.time >= bufStart && p.time <= end);
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { time: number } }[];
  segmentBoundaries?: SegmentBoundary[];
  tagAnnotations?: ChartAnnotation[];
}

function ChartTooltip({ active, payload, segmentBoundaries, tagAnnotations }: ChartTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const { time } = payload[0].payload;
  const score = payload[0].value;
  const segment = segmentBoundaries ? getSegmentAtTime(time, segmentBoundaries) : null;
  const nearbyTags = tagAnnotations ? getTagsAtTime(time, tagAnnotations) : [];
  return (
    <div className="rounded border border-border bg-popover px-2 py-1 text-xs shadow">
      <div className="font-medium">{formatTime(new Date(time))}</div>
      <div className="text-muted-foreground">Energia: {score}</div>
      {segment && <div className="text-muted-foreground">{segment}</div>}
      {nearbyTags.map((tag) => (
        <div key={tag.id} className="text-cyan-400">
          {tag.icon ?? "●"} {tag.label}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared gradient defs                                               */
/* ------------------------------------------------------------------ */

const GradientDefs = memo(function GradientDefs() {
  return (
    <defs>
      <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="fillYellow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eab308" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#eab308" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="fillMinimap" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
      </linearGradient>
    </defs>
  );
});

/* ------------------------------------------------------------------ */
/*  Minimap strip (always 32px, gray, simple)                          */
/* ------------------------------------------------------------------ */

interface MinimapProps {
  chartPoints: ChartPoint[];
  domain: [number, number];
  segmentBoundaries: SegmentBoundary[];
  windowHighlight?: { start: number; end: number };
}

const Minimap = memo(function Minimap({
  chartPoints,
  domain,
  segmentBoundaries,
  windowHighlight,
}: MinimapProps) {
  return (
    <ChartContainer config={CHART_CONFIG} className="h-[32px] w-full [&_svg]:border-0">
      <AreaChart data={chartPoints} margin={MINIMAP_MARGIN}>
        <GradientDefs />

        <XAxis dataKey="time" type="number" domain={domain} allowDataOverflow hide />
        <YAxis domain={Y_DOMAIN} allowDataOverflow hide />

        {segmentBoundaries.map((b) => (
          <ReferenceLine
            key={`mini-seg-${b.time}`}
            x={b.time}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2 2"
          />
        ))}

        {windowHighlight && (
          <ReferenceArea
            x1={windowHighlight.start}
            x2={windowHighlight.end}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.5}
          />
        )}

        <Area
          type="monotone"
          dataKey="score"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
          fill="url(#fillMinimap)"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
});

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function EngagementGauge() {
  const engagement = useShowStore((s) => s.engagement);
  const engagementHistory = useShowStore((s) => s.engagementHistory);
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const tags = useShowStore((s) => s.tags);

  // Smooth 1s ticker — drives the detail chart domain for fluid scrolling
  const smoothNow = useTickingNow(1000);

  // Data-driven "now" — drives the minimap (only updates when new data arrives)
  const dataNow = useMemo(() => {
    if (engagementHistory.length === 0) return Date.now();
    return new Date(engagementHistory[engagementHistory.length - 1].timestamp).getTime();
  }, [engagementHistory]);

  const allChartPoints = useMemo(() => toChartPoints(engagementHistory), [engagementHistory]);
  const concertStart = useMemo(() => computeTimeDomain(show)[0], [show]);

  // 5-min sliding window
  const windowDomain: [number, number] = useMemo(
    () => [smoothNow - WINDOW_MS, smoothNow],
    [smoothNow],
  );
  const windowPoints = useMemo(
    () => filterVisible(allChartPoints, windowDomain[0], windowDomain[1]),
    [allChartPoints, windowDomain],
  );
  const windowTicks = useMemo(
    () => computeRoundTicks(windowDomain[0], windowDomain[1]),
    [windowDomain],
  );

  // Full concert domain
  const concertDomain: [number, number] = useMemo(
    () => [concertStart, Math.max(dataNow, concertStart + WINDOW_MS)],
    [concertStart, dataNow],
  );
  const concertTicks = useMemo(
    () => computeRoundTicks(concertDomain[0], concertDomain[1]),
    [concertDomain],
  );

  // Window highlight for minimap: quantize to 5s steps to reduce re-renders
  const MINIMAP_SNAP_MS = 5_000;
  const highlightStart = useMemo(
    () => Math.floor((smoothNow - WINDOW_MS) / MINIMAP_SNAP_MS) * MINIMAP_SNAP_MS,
    [smoothNow],
  );
  const highlightEnd = useMemo(
    () => Math.ceil(smoothNow / MINIMAP_SNAP_MS) * MINIMAP_SNAP_MS,
    [smoothNow],
  );

  const segmentBoundaries = useMemo(
    () => deriveSegmentBoundaries(timeline, show.setlist.segments),
    [timeline, show.setlist.segments],
  );

  const tagAnnotations = useMemo(() => deriveTagAnnotations(tags), [tags]);

  const [swapped, setSwapped] = useState(false);

  const strokeColor = getStrokeColor(engagement.score);
  const gradientId = getGradientId(engagement.score);

  // Top = always big, colorful, detailed. Bottom = always small, gray.
  // `swapped` toggles which DATA feeds which position.
  const topData = swapped ? allChartPoints : windowPoints;
  const topDomain = swapped ? concertDomain : windowDomain;
  const topTicks = swapped ? concertTicks : windowTicks;

  const bottomData = swapped ? windowPoints : allChartPoints;
  const bottomDomain = swapped ? windowDomain : concertDomain;

  // Window highlight only when full concert is on the bottom (default)
  const windowHighlight = !swapped ? { start: highlightStart, end: highlightEnd } : undefined;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Energia
          <span className="font-normal opacity-60"> · {swapped ? "Timeline" : "Live"}</span>
        </span>
      </div>

      {/* Inline layout: score left + charts right */}
      <div className="flex items-start gap-4">
        {/* Score + trend */}
        <div className="flex w-[72px] shrink-0 flex-col items-center pt-4">
          <span
            className={cn(
              "font-mono text-4xl font-bold tabular-nums leading-none",
              getScoreColor(engagement.score),
            )}
          >
            {engagement.score}
          </span>
          <div className="mt-1 flex items-center gap-1">
            <span className={cn("text-lg font-bold leading-none", getTrendClass(engagement.trend))}>
              {getTrendArrow(engagement.trend)}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                getTrendClass(engagement.trend),
              )}
            >
              {getTrendLabel(engagement.trend)}
            </span>
          </div>
        </div>

        {/* Charts column */}
        {windowPoints.length >= 2 && (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Top chart — always 120px, colorful, full-featured */}
            <ChartContainer config={CHART_CONFIG} className="h-[120px] w-full [&_svg]:border-0">
              <AreaChart data={topData} margin={DETAIL_MARGIN}>
                <GradientDefs />

                <XAxis
                  dataKey="time"
                  type="number"
                  domain={topDomain}
                  allowDataOverflow
                  ticks={topTicks}
                  tickFormatter={formatTickTime}
                  tick={TICK_STYLE}
                  axisLine={AXIS_LINE_STYLE}
                  tickLine={false}
                />
                <YAxis domain={Y_DOMAIN} allowDataOverflow hide />

                <Tooltip
                  content={
                    <ChartTooltip
                      segmentBoundaries={segmentBoundaries}
                      tagAnnotations={tagAnnotations}
                    />
                  }
                />

                {segmentBoundaries.map((b) => (
                  <ReferenceLine
                    key={`seg-${b.time}`}
                    x={b.time}
                    stroke="rgba(255,255,255,0.35)"
                    strokeDasharray="3 3"
                    label={{
                      value: b.segmentName,
                      position: "insideTopRight",
                      fill: "rgba(255,255,255,0.5)",
                      fontSize: 9,
                      angle: -90,
                      dx: 6,
                      dy: 20,
                    }}
                  />
                ))}

                <ReferenceLine
                  x={smoothNow}
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={strokeColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={ACTIVE_DOT}
                  isAnimationActive={false}
                />

                {tagAnnotations.map((a) => {
                  const t = new Date(a.timestamp).getTime();
                  return (
                    <ReferenceLine
                      key={`tag-${a.id}`}
                      x={t}
                      stroke="#06b6d4"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      label={{
                        value: a.icon ?? "●",
                        position: "insideTopLeft",
                        fill: "#06b6d4",
                        fontSize: 12,
                        dx: -1,
                        dy: 4,
                      }}
                    />
                  );
                })}
              </AreaChart>
            </ChartContainer>

            {/* Bottom minimap — always 32px, gray, click to swap */}
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground opacity-60">
              {swapped ? "Live" : "Timeline"}
            </span>
            <button
              type="button"
              className="w-full cursor-pointer rounded border-0 bg-transparent p-0 text-left outline-none hover:bg-white/[0.03] [&_*]:border-0 [&_*]:outline-none"
              onClick={() => setSwapped((s) => !s)}
            >
              <Minimap
                chartPoints={bottomData}
                domain={bottomDomain}
                segmentBoundaries={segmentBoundaries}
                windowHighlight={windowHighlight}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
