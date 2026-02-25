import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, Customized, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { EngagementTrend } from "@/entities/engagement-metric";
import { useShowStore } from "@/entities/show";
import { formatTime } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { type ChartConfig, ChartContainer } from "@/shared/ui/chart";
import {
  computeRoundTicks,
  computeTimeDomain,
  deriveSegmentBoundaries,
  deriveTagAnnotations,
  getSegmentAtTime,
  MIN_WINDOW_MS,
  type SegmentBoundary,
  toChartPoints,
  zoomDomain,
} from "../lib/chartSelectors";
import { TagMarkers } from "./TagMarkers";

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
      return "rośnie";
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

const chartConfig = {
  score: {
    label: "Energia",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

function formatTickTime(epoch: number): string {
  return formatTime(new Date(epoch));
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { time: number } }[];
  segmentBoundaries?: SegmentBoundary[];
}

function ChartTooltip({ active, payload, segmentBoundaries }: ChartTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const { time } = payload[0].payload;
  const score = payload[0].value;
  const segment = segmentBoundaries ? getSegmentAtTime(time, segmentBoundaries) : null;
  return (
    <div className="rounded border border-border bg-popover px-2 py-1 text-xs shadow">
      <div className="font-medium">{formatTime(new Date(time))}</div>
      <div className="text-muted-foreground">Energia: {score}</div>
      {segment && <div className="text-muted-foreground">{segment}</div>}
    </div>
  );
}

function useTickingNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const ANIMATION_MS = 200;

function useAnimatedDomain(initial: [number, number]): {
  display: [number, number];
  setTarget: (target: [number, number]) => void;
} {
  const [display, setDisplay] = useState(initial);
  const displayRef = useRef(initial);
  const startRef = useRef(initial);
  const targetRef = useRef(initial);
  const startTimeRef = useRef(0);
  const animRef = useRef<number | null>(null);

  // Keep displayRef in sync without adding to callback deps
  displayRef.current = display;

  const setTarget = useCallback((target: [number, number]) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    startRef.current = [displayRef.current[0], displayRef.current[1]];
    targetRef.current = target;
    startTimeRef.current = performance.now();

    function step(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;

      const s = startRef.current;
      const t = targetRef.current;
      const current: [number, number] = [
        s[0] + (t[0] - s[0]) * eased,
        s[1] + (t[1] - s[1]) * eased,
      ];
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(t);
      }
    }

    animRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return { display, setTarget };
}

export function EngagementGauge() {
  const engagement = useShowStore((s) => s.engagement);
  const engagementHistory = useShowStore((s) => s.engagementHistory);
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const tags = useShowStore((s) => s.tags);

  const now = useTickingNow();
  const nowRef = useRef(now);
  nowRef.current = now;

  const chartPoints = useMemo(() => toChartPoints(engagementHistory), [engagementHistory]);
  const fullDomain = useMemo(() => computeTimeDomain(show), [show]);

  // Logical domain (target for zoom), animated for smooth transitions
  const logicalRef = useRef(fullDomain);
  const { display: visibleDomain, setTarget } = useAnimatedDomain(fullDomain);

  // Sync when fullDomain changes (e.g. show starts)
  useEffect(() => {
    logicalRef.current = fullDomain;
    setTarget(fullDomain);
  }, [fullDomain, setTarget]);

  const fullSpan = fullDomain[1] - fullDomain[0];
  const currentSpan = logicalRef.current[1] - logicalRef.current[0];
  const isZoomed = currentSpan < fullSpan * 0.95;
  const isMaxZoomed = currentSpan <= MIN_WINDOW_MS;

  const handleZoomIn = useCallback(() => {
    const next = zoomDomain(logicalRef.current, fullDomain, nowRef.current, 1);
    logicalRef.current = next;
    setTarget(next);
  }, [fullDomain, setTarget]);

  const handleZoomOut = useCallback(() => {
    const next = zoomDomain(logicalRef.current, fullDomain, nowRef.current, -1);
    logicalRef.current = next;
    setTarget(next);
  }, [fullDomain, setTarget]);

  const handleReset = useCallback(() => {
    logicalRef.current = fullDomain;
    setTarget(fullDomain);
  }, [fullDomain, setTarget]);

  const ticks = useMemo(
    () => computeRoundTicks(visibleDomain[0], visibleDomain[1]),
    [visibleDomain],
  );

  const segmentBoundaries = useMemo(
    () => deriveSegmentBoundaries(timeline, show.setlist.segments),
    [timeline, show.setlist.segments],
  );

  const tagAnnotations = useMemo(() => deriveTagAnnotations(tags), [tags]);

  const strokeColor = getStrokeColor(engagement.score);
  const gradientId = getGradientId(engagement.score);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      {/* Header + zoom controls */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Energia
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!isZoomed}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Oddal"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isZoomed}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Resetuj zoom"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={isMaxZoomed}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Przybliż"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Inline layout: score left + chart right */}
      <div className="flex items-center gap-4">
        {/* Score + trend */}
        <div className="flex shrink-0 flex-col items-center">
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

        {/* Chart */}
        {chartPoints.length >= 2 && (
          <ChartContainer config={chartConfig} className="h-[120px] min-w-0 flex-1">
            <AreaChart data={chartPoints} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
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
              </defs>

              <XAxis
                dataKey="time"
                type="number"
                domain={visibleDomain}
                allowDataOverflow
                ticks={ticks}
                tickFormatter={formatTickTime}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis domain={[0, 100]} allowDataOverflow hide />

              <Tooltip content={<ChartTooltip segmentBoundaries={segmentBoundaries} />} />

              {/* Segment boundary lines (no labels) */}
              {segmentBoundaries.map((b) => (
                <ReferenceLine
                  key={`seg-${b.time}`}
                  x={b.time}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="3 3"
                />
              ))}

              {/* "Now" indicator — subtle accent for dark mode */}
              <ReferenceLine
                x={now}
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
                activeDot={{ r: 3, fill: "white" }}
              />

              {/* Tag markers */}
              <Customized
                component={(props: Record<string, unknown>) => {
                  const xAxisMap = props.xAxisMap as
                    | Record<string, { scale: (v: number) => number }>
                    | undefined;
                  const yAxisMap = props.yAxisMap as
                    | Record<string, { scale: (v: number) => number }>
                    | undefined;
                  const xScale = xAxisMap?.[0]?.scale;
                  const yScale = yAxisMap?.[0]?.scale;
                  if (!xScale || !yScale) return null;
                  return (
                    <TagMarkers
                      annotations={tagAnnotations}
                      chartPoints={chartPoints}
                      xScale={xScale}
                      yScale={yScale}
                    />
                  );
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
