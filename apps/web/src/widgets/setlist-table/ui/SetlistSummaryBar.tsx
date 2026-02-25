import type { EditorSegment } from "@/entities/show";
import { formatDuration } from "@/shared/lib/format-duration";

interface SetlistSummaryBarProps {
  segments: EditorSegment[];
  startTime?: string;
}

function addSecondsToTime(time: string, seconds: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + seconds / 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = Math.round(totalMinutes % 60);
  return `${endH}:${endM.toString().padStart(2, "0")}`;
}

export function SetlistSummaryBar({ segments, startTime }: SetlistSummaryBarProps) {
  const totalFull = segments.reduce((sum, s) => sum + s.durationFull, 0);
  const totalShort = segments.reduce((sum, s) => sum + (s.durationShort ?? s.durationFull), 0);
  const estimatedEnd = startTime ? addSecondsToTime(startTime, totalFull) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground">
      <span>{segments.length} segmentów</span>
      <span className="text-zinc-600">·</span>
      <span>
        Pełna: <span className="font-mono tabular-nums">{formatDuration(totalFull)}</span>
      </span>
      <span className="text-zinc-600">·</span>
      <span>
        Krótka: <span className="font-mono tabular-nums">{formatDuration(totalShort)}</span>
      </span>
      {estimatedEnd && (
        <>
          <span className="text-zinc-600">·</span>
          <span>
            Koniec: <span className="font-mono tabular-nums">{estimatedEnd}</span>
          </span>
        </>
      )}
    </div>
  );
}
