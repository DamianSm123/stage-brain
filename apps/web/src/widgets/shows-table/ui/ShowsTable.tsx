import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { DashboardShow } from "@/entities/show";
import { getShowUrgency, useShowStore, useShowsStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { getColumns } from "./columns";
import { DeleteShowDialog } from "./DeleteShowDialog";
import { GroupHeader } from "./GroupHeader";

export function ShowsTable() {
  const navigate = useNavigate();
  const store = useShowsStore();
  const { page, pageSize, deleteShow } = store;

  const filtered = store.getFilteredShows();
  const totalCount = filtered.length;
  const pageCount = store.getTotalPages();
  const pageData = store.getPaginatedData();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [finishedCollapsed, setFinishedCollapsed] = useState(false);
  const [showToDelete, setShowToDelete] = useState<DashboardShow | null>(null);

  const { updateShow } = store;

  const hasLiveShow = useMemo(() => filtered.some((s) => s.status === "NA_ZYWO"), [filtered]);

  // Auto-refresh every 30s to update urgency indicators
  const hasReadyShows = useMemo(() => filtered.some((s) => s.status === "GOTOWY"), [filtered]);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!hasReadyShows) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [hasReadyShows]);

  const onNavigate = useCallback((path: string) => navigate(path), [navigate]);

  const onDelete = useCallback((show: DashboardShow) => {
    setShowToDelete(show);
  }, []);

  const onStartLive = useCallback(
    (show: DashboardShow) => {
      useShowStore.getState().startShow(show);
      updateShow(show.id, { status: "NA_ZYWO" });
      navigate("/live");
    },
    [updateShow, navigate],
  );

  const onEndLive = useCallback(
    (show: DashboardShow) => {
      useShowStore.getState().setShowStatus("ended");
      updateShow(show.id, { status: "ZAKONCZONY" });
    },
    [updateShow],
  );

  const handleConfirmDelete = useCallback(() => {
    if (showToDelete) {
      deleteShow(showToDelete.id);
      setShowToDelete(null);
    }
  }, [showToDelete, deleteShow]);

  const columns = useMemo(
    () => getColumns({ onDelete, onNavigate, onStartLive, onEndLive, hasLiveShow }),
    [onDelete, onNavigate, onStartLive, onEndLive, hasLiveShow],
  );

  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnVisibility },
    manualPagination: true,
    pageCount,
  });

  const sortedRows = table.getRowModel().rows;

  const upcomingRows = useMemo(
    () =>
      sortedRows.filter((r) => {
        const s = r.original.status;
        return s === "SZKIC" || s === "GOTOWY" || s === "NA_ZYWO";
      }),
    [sortedRows],
  );

  const finishedRows = useMemo(
    () => sortedRows.filter((r) => r.original.status === "ZAKONCZONY"),
    [sortedRows],
  );

  const headerGroups = table.getHeaderGroups();
  const totalColumns = headerGroups[0]?.headers.length ?? 10;

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const handleRowClick = (show: DashboardShow) => {
    if (show.status === "NA_ZYWO") {
      navigate("/live");
    } else if (show.status === "ZAKONCZONY") {
      navigate(`/post-show/${show.id}`);
    } else {
      navigate(`/shows/${show.id}`);
    }
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(pageCount, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, pageCount]);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 text-[13px] text-muted-foreground">
        {totalCount} koncert{totalCount === 1 ? "" : totalCount < 5 ? "y" : "ów"}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              {headerGroups.map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as { className?: string } | undefined;
                    return (
                      <TableHead key={header.id} className={meta?.className}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {upcomingRows.length > 0 && (
                <>
                  <GroupHeader
                    label="Nadchodzące"
                    count={upcomingRows.length}
                    isCollapsed={upcomingCollapsed}
                    onToggle={() => setUpcomingCollapsed((v) => !v)}
                    colSpan={totalColumns}
                  />
                  {upcomingRows.map((row) => {
                    const isLive = row.original.status === "NA_ZYWO";
                    const urgency = !isLive ? getShowUrgency(row.original) : null;
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          "border-l-2 transition-[border-color,background-color] duration-300",
                          upcomingCollapsed
                            ? "border-transparent border-l-transparent pointer-events-none"
                            : "cursor-pointer hover:bg-zinc-900/50 border-l-transparent",
                          isLive &&
                            !upcomingCollapsed &&
                            "!border-l-green-500 bg-green-500/5 hover:bg-green-500/10",
                          !upcomingCollapsed &&
                            urgency === "imminent" &&
                            "!border-l-amber-500 bg-amber-500/10 animate-pulse",
                          !upcomingCollapsed &&
                            urgency === "soon" &&
                            "!border-l-amber-500/60 bg-amber-500/5",
                        )}
                        onClick={() => !upcomingCollapsed && handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as
                            | { className?: string }
                            | undefined;
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                meta?.className,
                                "transition-[padding] duration-300",
                                upcomingCollapsed && "!py-0",
                              )}
                            >
                              <div
                                className={cn(
                                  "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                                  upcomingCollapsed
                                    ? "grid-rows-[0fr] opacity-0"
                                    : "grid-rows-[1fr] opacity-100",
                                )}
                              >
                                <div className="overflow-hidden">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </>
              )}

              {finishedRows.length > 0 && (
                <>
                  <GroupHeader
                    label="Zakończone"
                    count={finishedRows.length}
                    isCollapsed={finishedCollapsed}
                    onToggle={() => setFinishedCollapsed((v) => !v)}
                    colSpan={totalColumns}
                  />
                  {finishedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "transition-[border-color] duration-300",
                        finishedCollapsed
                          ? "border-transparent pointer-events-none"
                          : "cursor-pointer hover:bg-zinc-900/50",
                      )}
                      onClick={() => !finishedCollapsed && handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as
                          | { className?: string }
                          | undefined;
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              meta?.className,
                              "transition-[padding] duration-300",
                              finishedCollapsed && "!py-0",
                            )}
                          >
                            <div
                              className={cn(
                                "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                                finishedCollapsed
                                  ? "grid-rows-[0fr] opacity-0"
                                  : "grid-rows-[1fr] opacity-100",
                              )}
                            >
                              <div className="overflow-hidden">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}

              {upcomingRows.length === 0 && finishedRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Brak wyników dla wybranych filtrów.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-auto shrink-0 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <span className="text-[13px] text-muted-foreground">
            Wyświetlanie {startItem}–{endItem} z {totalCount}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">Wierszy:</span>
            <Select value={String(pageSize)} onValueChange={(v) => store.setPageSize(Number(v))}>
              <SelectTrigger className="w-[70px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page <= 1}
              onClick={() => store.setPage(1)}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page <= 1}
              onClick={() => store.setPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="size-10"
                onClick={() => store.setPage(p)}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page >= pageCount}
              onClick={() => store.setPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={page >= pageCount}
              onClick={() => store.setPage(pageCount)}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <DeleteShowDialog
        show={showToDelete}
        open={showToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setShowToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
