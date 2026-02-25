import { EllipsisVertical, FileText, Pencil, Play, Radio, Square, Trash2 } from "lucide-react";
import type { DashboardShow } from "@/entities/show";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

interface ShowActionsProps {
  show: DashboardShow;
  hasLiveShow: boolean;
  onDelete: (show: DashboardShow) => void;
  onNavigate: (path: string) => void;
  onStartLive: (show: DashboardShow) => void;
  onEndLive: (show: DashboardShow) => void;
}

export function ShowActions({
  show,
  hasLiveShow,
  onDelete,
  onNavigate,
  onStartLive,
  onEndLive,
}: ShowActionsProps) {
  const isStartLiveDisabled = hasLiveShow && show.status === "GOTOWY";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex items-center justify-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={stop}>
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop}>
          {show.status === "SZKIC" && (
            <DropdownMenuItem onClick={() => onNavigate(`/shows/${show.id}`)}>
              <Pencil className="size-4" />
              Edytuj
            </DropdownMenuItem>
          )}

          {show.status === "GOTOWY" && (
            <>
              <DropdownMenuItem onClick={() => onNavigate(`/shows/${show.id}`)}>
                <Pencil className="size-4" />
                Edytuj
              </DropdownMenuItem>
              {isStartLiveDisabled ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <DropdownMenuItem disabled>
                          <Play className="size-4" />
                          Uruchom live
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={4}>
                      Nie można uruchomić — inny koncert jest już na żywo
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <DropdownMenuItem onClick={() => onStartLive(show)}>
                  <Play className="size-4" />
                  Uruchom live
                </DropdownMenuItem>
              )}
            </>
          )}

          {show.status === "NA_ZYWO" && (
            <>
              <DropdownMenuItem onClick={() => onNavigate("/live")}>
                <Radio className="size-4" />
                Przejdź do live
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEndLive(show)}>
                <Square className="size-4" />
                Zakończ live
              </DropdownMenuItem>
            </>
          )}

          {show.status === "ZAKONCZONY" && (
            <DropdownMenuItem onClick={() => onNavigate(`/post-show/${show.id}`)}>
              <FileText className="size-4" />
              Zobacz raport
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => onDelete(show)}
          >
            <Trash2 className="size-4" />
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
