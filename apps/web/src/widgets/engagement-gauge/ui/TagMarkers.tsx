import type { ChartAnnotation } from "@/entities/engagement-metric";
import type { ChartPoint } from "../lib/chartSelectors";

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
            <line x1={cx} y1={cy - 14} x2={cx} y2={cy - 4} stroke="white" strokeOpacity={0.3} />
            <text
              x={cx}
              y={cy - 16}
              textAnchor="middle"
              fontSize={12}
              fill="white"
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
