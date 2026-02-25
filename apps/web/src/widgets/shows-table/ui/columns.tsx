import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { DashboardShow } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { DataTableColumnHeader } from "@/shared/ui/data-table-column-header";
import { ShowActions } from "./ShowActions";
import { ShowStatusBadge } from "./ShowStatusBadge";

const columnHelper = createColumnHelper<DashboardShow>();

function formatDurationHM(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}min`;
}

function formatDelta(deltaSeconds: number): { text: string; className: string } {
  const sign = deltaSeconds > 0 ? "+" : "";
  const abs = Math.abs(deltaSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const text = `${sign}${deltaSeconds < 0 ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;

  if (deltaSeconds <= 0) return { text, className: "text-green-500" };
  if (deltaSeconds <= 300) return { text, className: "text-yellow-500" };
  return { text, className: "text-red-500" };
}

function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate);
  const months = [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function engagementColor(value: number): string {
  if (value < 30) return "text-red-500";
  if (value <= 60) return "text-yellow-500";
  return "text-green-500";
}

interface ColumnsOptions {
  onDelete: (show: DashboardShow) => void;
  onNavigate: (path: string) => void;
  onStartLive: (show: DashboardShow) => void;
  onEndLive: (show: DashboardShow) => void;
  hasLiveShow: boolean;
}

export function getColumns({
  onDelete,
  onNavigate,
  onStartLive,
  onEndLive,
  hasLiveShow,
}: ColumnsOptions): ColumnDef<DashboardShow, unknown>[] {
  return [
    columnHelper.accessor("name", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nazwa" />,
      cell: (info) => (
        <div className="text-sm font-semibold text-foreground truncate">{info.getValue()}</div>
      ),
      meta: { className: "w-[200px] xl:w-[280px]" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("venue", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Obiekt" />,
      cell: ({ getValue }) => {
        const venue = getValue();
        if (!venue) return <span className="text-muted-foreground">—</span>;
        return (
          <div>
            <div className="text-sm truncate">{venue.name}</div>
            <div className="text-xs text-muted-foreground">{venue.city}</div>
          </div>
        );
      },
      meta: { className: "w-[140px] xl:w-[180px]" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("date", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      cell: (info) => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground">—</span>;
        return <span className="text-sm font-mono tabular-nums">{formatDateShort(val)}</span>;
      },
      meta: { className: "w-[120px]" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.display({
      id: "timeRange",
      header: "Start\u2192Koniec",
      enableSorting: false,
      cell: ({ row }) => {
        const { startTime, endTime } = row.original;
        if (!startTime && !endTime) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm font-mono tabular-nums">
            {startTime || "—"}→{endTime || "—"}
          </span>
        );
      },
      meta: { className: "w-[110px] xl:w-[120px]" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("duration", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Czas trw." />,
      cell: ({ getValue, row }) => {
        const val = getValue();
        if (val == null) return <span className="text-muted-foreground">—</span>;
        const isEstimate = row.original.status !== "ZAKONCZONY";
        return (
          <span className="text-sm font-mono tabular-nums">
            {isEstimate && "~"}
            {formatDurationHM(val)}
          </span>
        );
      },
      meta: { className: "w-[80px] hidden xl:table-cell" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("delta", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Δ" />,
      cell: (info) => {
        const val = info.getValue();
        if (val == null) return <span className="text-muted-foreground">—</span>;
        const { text, className } = formatDelta(val);
        return (
          <span className={cn("text-sm font-mono font-semibold tabular-nums", className)}>
            {text}
          </span>
        );
      },
      meta: { className: "w-[70px] hidden xl:table-cell" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("engagement", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Energia" />,
      cell: (info) => {
        const val = info.getValue();
        if (val == null) return <span className="text-muted-foreground">—</span>;
        return (
          <span className={cn("text-sm font-mono tabular-nums", engagementColor(val))}>{val}</span>
        );
      },
      meta: { className: "w-[48px] hidden xl:table-cell text-center" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.accessor("status", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <ShowStatusBadge status={info.getValue()} />,
      meta: { className: "w-[100px]" },
    }) as ColumnDef<DashboardShow, unknown>,

    columnHelper.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <ShowActions
          show={row.original}
          hasLiveShow={hasLiveShow}
          onDelete={onDelete}
          onNavigate={onNavigate}
          onStartLive={onStartLive}
          onEndLive={onEndLive}
        />
      ),
      meta: { className: "w-[70px] text-right" },
    }) as ColumnDef<DashboardShow, unknown>,
  ];
}
