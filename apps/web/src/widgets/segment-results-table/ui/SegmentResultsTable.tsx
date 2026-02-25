import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Segment, TimelineEntry } from "@/entities/segment";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import type { SegmentEngagement } from "@/widgets/post-show-chart";

interface SegmentResultsTableProps {
  segments: Segment[];
  timeline: TimelineEntry[];
  engagement: SegmentEngagement[];
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDelta(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  const sign = totalSeconds >= 0 ? "+" : "-";
  return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getDeltaColor(deltaSeconds: number): string {
  const abs = Math.abs(deltaSeconds);
  if (abs <= 30) return "text-green-500";
  if (abs <= 120) return "text-yellow-500";
  return "text-red-500";
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function SegmentResultsTable({ segments, timeline, engagement }: SegmentResultsTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const engagementMap = new Map(engagement.map((e) => [e.segment_id, e]));

  const totalRows = segments.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const paginatedSegments = segments.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const startItem = totalRows === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endItem = Math.min(clampedPage * pageSize, totalRows);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, clampedPage - Math.floor(maxVisible / 2));
    const end = Math.min(pageCount, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [clampedPage, pageCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wyniki segmentów</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nazwa</TableHead>
              <TableHead className="text-right">Plan</TableHead>
              <TableHead className="text-right">Faktyczny</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead>Wariant</TableHead>
              <TableHead className="text-right">Śr. energia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSegments.map((segment) => {
              const entry = timeline.find((e) => e.segment_id === segment.id);
              const eng = engagementMap.get(segment.id);
              const isSkipped = entry?.status === "skipped";

              return (
                <TableRow key={segment.id} className={cn(isSkipped && "opacity-50")}>
                  <TableCell className="tabular-nums">{segment.position}</TableCell>
                  <TableCell className={cn("font-medium", isSkipped && "line-through")}>
                    {segment.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(entry?.planned_duration_seconds ?? 0)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", isSkipped && "italic")}>
                    {isSkipped ? "POMINIĘTY" : formatDuration(entry?.actual_duration_seconds ?? 0)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      isSkipped
                        ? "text-muted-foreground"
                        : getDeltaColor(entry?.delta_seconds ?? 0),
                    )}
                  >
                    {isSkipped ? "—" : formatDelta(entry?.delta_seconds ?? 0)}
                  </TableCell>
                  <TableCell>{isSkipped ? "—" : (entry?.variant_used ?? "—")}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {eng ? eng.avg_score : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalRows > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[13px] text-muted-foreground">
              Wyświetlanie {startItem}–{endItem} z {totalRows}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted-foreground">Wierszy:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger size="sm" className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={clampedPage <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={clampedPage <= 1}
                onClick={() => setPage(clampedPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {pageNumbers.map((p) => (
                <Button
                  key={p}
                  variant={p === clampedPage ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={clampedPage >= pageCount}
                onClick={() => setPage(clampedPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={clampedPage >= pageCount}
                onClick={() => setPage(pageCount)}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
