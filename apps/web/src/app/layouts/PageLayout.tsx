import { NavLink, Outlet } from "react-router";
import { useShowsStore } from "@/entities/show";
import { NAV_ITEMS, ROUTES } from "@/shared/config/navigation";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

export function PageLayout() {
  const shows = useShowsStore((s) => s.shows);
  const hasLiveShow = shows.some((s) => s.status === "NA_ZYWO");

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="p-4">
          <h1 className="text-lg font-bold tracking-tight">StageBrain</h1>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-2">
          <TooltipProvider delayDuration={200}>
            {NAV_ITEMS.map((item) => {
              const isLiveDisabled = item.path === ROUTES.LIVE && !hasLiveShow;
              const isStatisticsDisabled = item.path === ROUTES.STATISTICS;

              const disabledTooltip = isLiveDisabled
                ? "Brak aktywnego koncertu"
                : isStatisticsDisabled
                  ? "Niedostępne w prototypie"
                  : null;

              if (disabledTooltip) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <span className="cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/40">
                        {item.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" sideOffset={4}>
                      {disabledTooltip}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            })}
          </TooltipProvider>
        </nav>
      </aside>
      <main className="flex flex-1 flex-col overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
