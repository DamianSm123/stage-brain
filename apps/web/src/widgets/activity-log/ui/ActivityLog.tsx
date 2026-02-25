import { useCallback, useEffect, useRef, useState } from "react";
import { useShowStore } from "@/entities/show";
import { formatTime } from "@/shared/lib/formatTime";
import { Button } from "@/shared/ui/button";

const STORAGE_KEY = "stagebrain-activity-log-height";
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 200;
const DEFAULT_HEIGHT = 96;

function getStoredHeight(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = Number.parseInt(stored, 10);
      if (val >= MIN_HEIGHT && val <= MAX_HEIGHT) return val;
    }
  } catch {
    // ignore
  }
  return DEFAULT_HEIGHT;
}

export function ActivityLog() {
  const activityLog = useShowStore((s) => s.activityLog);
  const undoLastAction = useShowStore((s) => s.undoLastAction);

  const [height, setHeight] = useState(getStoredHeight);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(height));
    } catch {
      // ignore
    }
  }, [height]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = height;
      e.preventDefault();
    },
    [height],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const diff = startY.current - e.clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight.current + diff));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const lastReversible = activityLog.find((e) => e.reversible);
  const latestEntry = activityLog[0] ?? null;
  const isCompact = height <= 52;

  return (
    <div className="shrink-0 border-t border-border bg-card" style={{ height }}>
      {/* Uchwyt do zmiany wysokości */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: resize drag handle */}
      <div
        className="flex h-3 cursor-row-resize items-center justify-center hover:bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="h-0.5 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Zawartość logu */}
      <div className="flex h-[calc(100%-12px)] flex-col px-4 pb-1">
        {isCompact ? (
          /* Tryb kompaktowy — nagłówek + ostatni wpis + cofnij w jednej linii */
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dziennik zdarzeń
            </span>

            {latestEntry && (
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0 font-mono text-xs tabular-nums">
                  {formatTime(new Date(latestEntry.timestamp))}
                </span>
                <span className="shrink-0">{latestEntry.icon}</span>
                <span className="truncate text-foreground/70">{latestEntry.message}</span>
              </span>
            )}

            {lastReversible && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={undoLastAction}
              >
                ↩ Cofnij
              </Button>
            )}
          </div>
        ) : (
          /* Tryb rozwinięty — nagłówek + multi-column lista */
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dziennik zdarzeń
              </span>
              {lastReversible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={undoLastAction}
                >
                  ↩ Cofnij
                </Button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="h-full columns-2 xl:columns-3 gap-x-8" style={{ columnFill: "auto" }}>
                {activityLog.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2.5 break-inside-avoid rounded px-1.5 py-[3px] text-sm leading-5 ${index % 2 === 0 ? "bg-muted/40" : ""}`}
                  >
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatTime(new Date(entry.timestamp))}
                    </span>
                    <span className="shrink-0 w-4 text-center text-sm">{entry.icon}</span>
                    <span className="truncate text-foreground/70">{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
