import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { SetlistTemplate } from "@/entities/setlist-template";
import { Button } from "@/shared/ui/button";
import { DataTableColumnHeader } from "@/shared/ui/data-table-column-header";

const columnHelper = createColumnHelper<SetlistTemplate>();

function formatTotalDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getTemplateColumns(
  onDelete: (template: SetlistTemplate) => void,
): ColumnDef<SetlistTemplate, unknown>[] {
  return [
    columnHelper.accessor("name", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nazwa" />,
      cell: (info) => (
        <span className="text-sm font-semibold text-foreground">{info.getValue()}</span>
      ),
      meta: { className: "w-[30%]" },
    }) as ColumnDef<SetlistTemplate, unknown>,

    columnHelper.display({
      id: "segmentCount",
      header: "Segmenty",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm font-mono tabular-nums">{row.original.segments.length}</span>
      ),
      meta: { className: "w-[12%] text-center" },
    }) as ColumnDef<SetlistTemplate, unknown>,

    columnHelper.accessor("totalDurationFull", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pełna" />,
      cell: (info) => (
        <span className="text-sm font-mono tabular-nums">
          {formatTotalDuration(info.getValue())}
        </span>
      ),
      meta: { className: "w-[12%]" },
    }) as ColumnDef<SetlistTemplate, unknown>,

    columnHelper.accessor("totalDurationShort", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Krótka" />,
      cell: (info) => (
        <span className="text-sm font-mono tabular-nums">
          {formatTotalDuration(info.getValue())}
        </span>
      ),
      meta: { className: "w-[12%]" },
    }) as ColumnDef<SetlistTemplate, unknown>,

    columnHelper.accessor("note", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Notatka" />,
      cell: (info) => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground">—</span>;
        return <span className="text-[13px] text-muted-foreground truncate max-w-0">{val}</span>;
      },
      meta: { className: "w-[28%] hidden xl:table-cell" },
    }) as ColumnDef<SetlistTemplate, unknown>,

    columnHelper.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row.original);
          }}
          className="text-muted-foreground transition-colors hover:text-red-500"
        >
          <Trash2 className="size-4" />
        </Button>
      ),
      meta: { className: "w-[6%]" },
    }) as ColumnDef<SetlistTemplate, unknown>,
  ];
}
