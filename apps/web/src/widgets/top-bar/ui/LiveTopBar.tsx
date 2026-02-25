import { Link } from "react-router";
import { ROUTES } from "@/shared/config/navigation";
import { SystemStatus } from "./SystemStatus";

export function LiveTopBar() {
  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD}
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
        >
          StageBrain
        </Link>
        <SystemStatus />
      </div>
    </div>
  );
}
