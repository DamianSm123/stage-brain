import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { SetlistTemplate } from "@/entities/setlist-template";
import { useTemplatesStore } from "@/entities/setlist-template";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { getTemplateColumns } from "./columns";
import { DeleteTemplateDialog } from "./DeleteTemplateDialog";

export function TemplatesTable() {
  const navigate = useNavigate();
  const store = useTemplatesStore();
  const { page, pageSize, deleteTemplate } = store;

  const filtered = store.getFilteredTemplates();
  const totalCount = filtered.length;
  const pageCount = store.getTotalPages();
  const pageData = store.getPaginatedData();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [templateToDelete, setTemplateToDelete] = useState<SetlistTemplate | null>(null);

  const onDelete = useCallback((template: SetlistTemplate) => {
    setTemplateToDelete(template);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  }, [templateToDelete, deleteTemplate]);

  const columns = useMemo(() => getTemplateColumns(onDelete), [onDelete]);

  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    pageCount,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const handleRowClick = (template: SetlistTemplate) => {
    navigate(`/setlist-templates/${template.id}`);
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
        {totalCount} szablon{totalCount === 1 ? "" : totalCount < 5 ? "y" : "ów"}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="rounded-lg border border-border">
          <Table className="table-fixed">
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
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer min-h-[52px] transition-colors hover:bg-zinc-900/50"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                      return (
                        <TableCell key={cell.id} className={meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={headerGroups[0]?.headers.length ?? 6}
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
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[13px] text-muted-foreground">
            Wyświetlanie {startItem}–{endItem} z {totalCount}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground">Wierszy:</span>
            <Select value={String(pageSize)} onValueChange={(v) => store.setPageSize(Number(v))}>
              <SelectTrigger className="w-[70px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

      <DeleteTemplateDialog
        template={templateToDelete}
        open={templateToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
