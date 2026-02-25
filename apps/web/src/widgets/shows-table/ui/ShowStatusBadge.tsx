import type { DashboardShowStatus } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

const STATUS_CONFIG: Record<DashboardShowStatus, { label: string; className: string }> = {
  SZKIC: {
    label: "Szkic",
    className: "text-muted-foreground",
  },
  GOTOWY: {
    label: "Gotowy",
    className: "border-green-500 text-green-500",
  },
  NA_ZYWO: {
    label: "Na żywo",
    className: "bg-blue-500 text-white animate-pulse",
  },
  ZAKONCZONY: {
    label: "Zakończony",
    className: "border-muted-foreground text-muted-foreground",
  },
};

interface ShowStatusBadgeProps {
  status: DashboardShowStatus;
}

export function ShowStatusBadge({ status }: ShowStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const variant = status === "SZKIC" ? "secondary" : status === "NA_ZYWO" ? "default" : "outline";

  return (
    <Badge variant={variant} className={cn("h-6 text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}
