import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export interface SegmentEngagement {
  segment_id: string;
  segment_name: string;
  avg_score: number;
  peak_score: number;
}

export interface ChartTag {
  segment_id: string;
  tag: string;
  custom_text?: string;
}

interface EngagementChartProps {
  data: SegmentEngagement[];
  tags: ChartTag[];
}

const STATUS_GREEN = "#22c55e";
const STATUS_YELLOW = "#eab308";
const STATUS_RED = "#ef4444";
const NEUTRAL_GRAY = "#6b7280";

function getBarColor(score: number): string {
  if (score >= 80) return STATUS_GREEN;
  if (score >= 50) return STATUS_YELLOW;
  return STATUS_RED;
}

interface TagConfig {
  icon: string;
  color: string;
}

function getTagConfig(tag: string): TagConfig {
  switch (tag) {
    case "Peak moment":
      return { icon: "▲", color: STATUS_GREEN };
    case "Low energy":
      return { icon: "▼", color: STATUS_YELLOW };
    case "Tech issue":
      return { icon: "⚠", color: STATUS_RED };
    default:
      return { icon: "●", color: NEUTRAL_GRAY };
  }
}

interface TooltipPayloadItem {
  payload: SegmentEngagement;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const segment = payload[0].payload;

  return (
    <div className="rounded-md border border-border bg-[#1a1a2e] px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-white">{segment.segment_name}</p>
      <p className="text-xs text-gray-300">
        Średnia: <span className="font-medium text-white">{segment.avg_score}</span>
      </p>
      <p className="text-xs text-gray-300">
        Szczyt: <span className="font-medium text-white">{segment.peak_score}</span>
      </p>
      <p className="mt-1 text-[11px] text-gray-400">Kliknij, aby rozwinąć</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Synthetic time-series generator (deterministic, based on avg & peak)
// ---------------------------------------------------------------------------

interface TimeSeriesPoint {
  label: string;
  score: number;
}

function generateTimeSeries(avg: number, peak: number, segmentId: string): TimeSeriesPoint[] {
  const points = 16;
  // Deterministic seed from segment_id
  let seed = 0;
  for (let i = 0; i < segmentId.length; i++) {
    seed = (seed * 31 + segmentId.charCodeAt(i)) & 0xffff;
  }
  const peakPosition = 0.55 + (seed % 30) / 100; // 0.55–0.84

  const result: TimeSeriesPoint[] = [];
  const baseScore = avg * 0.7;
  const amplitude = peak - baseScore;

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const dist = t - peakPosition;
    const spreadLeft = 0.08;
    const spreadRight = 0.14;
    const spread = dist < 0 ? spreadLeft : spreadRight;
    const factor = Math.exp(-(dist * dist) / spread);

    // Deterministic noise from seed + index
    const n1 = Math.sin(i * 2.7 + seed * 0.1) * 3;
    const n2 = Math.cos(i * 4.1 + seed * 0.3) * 2;

    const score = Math.round(Math.min(100, Math.max(0, baseScore + amplitude * factor + n1 + n2)));

    const minutes = Math.floor(t * 4);
    const seconds = Math.round((t * 4 - minutes) * 60);
    const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    result.push({ label, score });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Drill-down tooltip
// ---------------------------------------------------------------------------

interface DrilldownTooltipPayloadItem {
  payload: TimeSeriesPoint;
}

interface DrilldownTooltipProps {
  active?: boolean;
  payload?: DrilldownTooltipPayloadItem[];
}

function DrilldownTooltip({ active, payload }: DrilldownTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-[#1a1a2e] px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-300">
        Czas: <span className="font-medium text-white">{point.label}</span>
      </p>
      <p className="text-xs text-gray-300">
        Energia: <span className="font-medium text-white">{point.score}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EngagementChart({ data, tags }: EngagementChartProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tagsBySegment = new Map<string, ChartTag[]>();
  for (const tag of tags) {
    const existing = tagsBySegment.get(tag.segment_id) ?? [];
    existing.push(tag);
    tagsBySegment.set(tag.segment_id, existing);
  }

  const expandedSegment = data.find((s) => s.segment_id === expandedId);
  const expandedTimeSeries = expandedSegment
    ? generateTimeSeries(expandedSegment.avg_score, expandedSegment.peak_score, expandedId ?? "")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wykres energii</CardTitle>
        <CardDescription>Kliknij segment, aby zobaczyć przebieg energii w czasie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <XAxis
              dataKey="segment_name"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar
              dataKey="avg_score"
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
              className="cursor-pointer"
              onClick={(_: unknown, index: number) => {
                const segment = data[index];
                setExpandedId(expandedId === segment.segment_id ? null : segment.segment_id);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.segment_id}
                  fill={getBarColor(entry.avg_score)}
                  stroke={entry.segment_id === expandedId ? "#fff" : "transparent"}
                  strokeWidth={entry.segment_id === expandedId ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Drill-down panel */}
        {expandedSegment && expandedTimeSeries && (
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{expandedSegment.segment_name}</h4>
                <p className="text-xs text-muted-foreground">
                  Średnia: {expandedSegment.avg_score} · Szczyt: {expandedSegment.peak_score}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setExpandedId(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={expandedTimeSeries}
                margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
              >
                <defs>
                  <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={getBarColor(expandedSegment.avg_score)}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor={getBarColor(expandedSegment.avg_score)}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={<DrilldownTooltip />}
                  cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }}
                />
                <ReferenceLine
                  y={expandedSegment.avg_score}
                  stroke="#a1a1aa"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={getBarColor(expandedSegment.avg_score)}
                  strokeWidth={2}
                  fill="url(#energyGradient)"
                  dot={{ r: 3, fill: getBarColor(expandedSegment.avg_score), strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              Przerywaną linią zaznaczono średnią energię segmentu
            </p>
          </div>
        )}

        {/* Expand hint */}
        {!expandedId && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ChevronDown className="size-3.5" />
            <span>Kliknij na słupek, aby zobaczyć szczegółowy przebieg energii</span>
          </div>
        )}

        {/* Tag markers */}
        <div className={cn("flex flex-wrap gap-x-6 gap-y-2", !expandedId && "mt-0")}>
          {data.map((segment) => {
            const segmentTags = tagsBySegment.get(segment.segment_id);
            if (!segmentTags?.length) return null;

            return (
              <div key={segment.segment_id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{segment.segment_name}:</span>
                <div className="flex gap-1">
                  {segmentTags.map((chartTag) => {
                    const config = getTagConfig(chartTag.tag);
                    const label = chartTag.custom_text
                      ? `${chartTag.tag} — ${chartTag.custom_text}`
                      : chartTag.tag;

                    return (
                      <span
                        key={`${chartTag.segment_id}-${chartTag.tag}-${chartTag.custom_text ?? ""}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
                        style={{ color: config.color }}
                      >
                        <span>{config.icon}</span>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
