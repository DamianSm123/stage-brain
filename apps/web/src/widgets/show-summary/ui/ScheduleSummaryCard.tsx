import { Clock } from "lucide-react";
import { formatDuration } from "@/shared/lib/format-duration";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface ScheduleSummaryCardProps {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  curfew: string;
  totalDurationFull: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ScheduleSummaryCard({
  date,
  startTime,
  endTime,
  curfew,
  totalDurationFull,
}: ScheduleSummaryCardProps) {
  const windowMinutes =
    startTime && endTime ? timeToMinutes(endTime) - timeToMinutes(startTime) : 0;
  const windowSeconds = Math.max(windowMinutes * 60, 0);
  const bufferSeconds = windowSeconds - totalDurationFull;
  const bufferMinutes = bufferSeconds / 60;

  const bufferColor =
    bufferMinutes < 0 ? "text-red-500" : bufferMinutes <= 15 ? "text-yellow-500" : "text-green-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold xl:text-lg">
          <Clock className="size-5" />
          Harmonogram
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-lg font-semibold">{date ? formatDate(date) : "—"}</p>
        {startTime && endTime && (
          <p className="text-sm text-muted-foreground">
            {startTime} → {endTime}
            {curfew && <span className="ml-2 text-xs text-orange-500">(curfew {curfew})</span>}
          </p>
        )}
        {windowSeconds > 0 && (
          <p className="text-sm text-muted-foreground">
            Okno: <span className="font-mono tabular-nums">{formatDuration(windowSeconds)}</span>
            {" · "}
            Bufor:{" "}
            <span className={cn("font-mono tabular-nums", bufferColor)}>
              ~
              {bufferSeconds >= 0
                ? formatDuration(bufferSeconds)
                : `-${formatDuration(Math.abs(bufferSeconds))}`}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
