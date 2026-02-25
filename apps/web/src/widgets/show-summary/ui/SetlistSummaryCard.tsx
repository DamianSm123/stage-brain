import { Music } from "lucide-react";
import type { EditorSegment } from "@/entities/show";
import { formatDuration } from "@/shared/lib/format-duration";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface SetlistSummaryCardProps {
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

export function SetlistSummaryCard({ segments, startTime }: SetlistSummaryCardProps) {
  const totalFull = segments.reduce((sum, s) => sum + s.durationFull, 0);
  const totalShort = segments.reduce((sum, s) => sum + (s.durationShort ?? s.durationFull), 0);
  const estimatedEnd = startTime ? addSecondsToTime(startTime, totalFull) : null;
  const filledSegments = segments.filter((s) => s.name.trim() !== "");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold xl:text-lg">
          <Music className="size-5" />
          Setlista
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-lg font-semibold">{segments.length} segmentów</p>
          {estimatedEnd && (
            <p className="text-sm text-muted-foreground">
              Koniec: ~<span className="font-mono tabular-nums">{estimatedEnd}</span>
            </p>
          )}
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Pełna: <span className="font-mono tabular-nums">{formatDuration(totalFull)}</span>
          </span>
          <span>
            Krótka: <span className="font-mono tabular-nums">{formatDuration(totalShort)}</span>
          </span>
        </div>

        {filledSegments.length > 0 && (
          <ol className="space-y-1 text-sm">
            {filledSegments.map((s, i) => (
              <li key={s.id} className="flex items-baseline gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="truncate">{s.name}</span>
                <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDuration(s.durationFull)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
