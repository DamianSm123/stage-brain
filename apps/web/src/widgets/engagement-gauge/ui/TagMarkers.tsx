import type { ChartAnnotation } from "@/entities/engagement-metric";
import type { ChartPoint } from "../lib/chartSelectors";

const TAG_COLOR = "#06b6d4"; // cyan-500 — distinct from white segment lines

interface TagMarkersProps {
  annotations: ChartAnnotation[];
  chartPoints: ChartPoint[];
  xScale: (value: number) => number;
  yScale: (value: number) => number;
}

function interpolateY(time: number, points: ChartPoint[]): number | null {
  if (points.length === 0) return null;

  // Before first point — use first
  if (time <= points[0].time) return points[0].score;
  // After last point — use last
  if (time >= points[points.length - 1].time) return points[points.length - 1].score;

  // Find surrounding points and interpolate
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (time >= a.time && time <= b.time) {
      const ratio = (time - a.time) / (b.time - a.time);
      return a.score + ratio * (b.score - a.score);
    }
  }
  return null;
}

export function TagMarkers({ annotations, chartPoints, xScale, yScale }: TagMarkersProps) {
  if (annotations.length === 0 || chartPoints.length === 0) return null;

  return (
    <g>
      {annotations.map((a) => {
        const t = new Date(a.timestamp).getTime();
        const score = interpolateY(t, chartPoints);
        if (score === null) return null;

        const cx = xScale(t);
        const cy = yScale(score);

        return (
          <g key={a.id}>
            {/* Solid thin line — distinct from dashed white segment lines */}
            <line
              x1={cx}
              y1={cy - 18}
              x2={cx}
              y2={cy - 5}
              stroke={TAG_COLOR}
              strokeOpacity={0.6}
              strokeWidth={1}
            />
            {/* Dot on the curve */}
            <circle cx={cx} cy={cy} r={3} fill={TAG_COLOR} fillOpacity={0.9} />
            {/* Icon above */}
            <text
              x={cx}
              y={cy - 22}
              textAnchor="middle"
              fontSize={11}
              fill={TAG_COLOR}
              style={{ pointerEvents: "none" }}
            >
              {a.icon ?? "●"}
            </text>
          </g>
        );
      })}
    </g>
  );
}
