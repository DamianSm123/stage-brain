import { formatDuration } from "@/shared/lib/format-duration";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/ui/progress";

interface SetlistTimeBarProps {
  totalDurationFull: number;
  startTime: string;
  endTime: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function SetlistTimeBar({ totalDurationFull, startTime, endTime }: SetlistTimeBarProps) {
  const availableMinutes =
    startTime && endTime ? timeToMinutes(endTime) - timeToMinutes(startTime) : 0;
  const availableSeconds = Math.max(availableMinutes * 60, 0);
  const bufferSeconds = availableSeconds - totalDurationFull;
  const bufferMinutes = bufferSeconds / 60;
  const utilization = availableSeconds > 0 ? (totalDurationFull / availableSeconds) * 100 : 0;

  const bufferColor =
    bufferMinutes < 0 ? "text-red-500" : bufferMinutes <= 15 ? "text-yellow-500" : "text-green-500";

  const barIndicatorClass =
    bufferMinutes < 0
      ? "[&_[data-slot=progress-indicator]]:bg-red-500"
      : bufferMinutes <= 15
        ? "[&_[data-slot=progress-indicator]]:bg-yellow-500"
        : "[&_[data-slot=progress-indicator]]:bg-green-500";

  const barTrackClass =
    bufferMinutes < 0
      ? "bg-red-500/20"
      : bufferMinutes <= 15
        ? "bg-yellow-500/20"
        : "bg-green-500/20";

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span>
          Setlista:{" "}
          <span className="font-mono tabular-nums font-medium">
            {formatDuration(totalDurationFull)}
          </span>
        </span>
        {availableSeconds > 0 && (
          <span>
            Dostępne:{" "}
            <span className="font-mono tabular-nums font-medium">
              {formatDuration(availableSeconds)}
            </span>
          </span>
        )}
        {availableSeconds > 0 && (
          <span>
            Bufor:{" "}
            <span className={cn("font-mono tabular-nums font-medium", bufferColor)}>
              {bufferSeconds >= 0
                ? formatDuration(bufferSeconds)
                : `-${formatDuration(Math.abs(bufferSeconds))}`}
            </span>
          </span>
        )}
      </div>
      {availableSeconds > 0 && (
        <Progress
          value={Math.min(utilization, 100)}
          className={cn("h-1.5", barTrackClass, barIndicatorClass)}
        />
      )}
    </div>
  );
}
