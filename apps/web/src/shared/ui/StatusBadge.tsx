import { Badge } from "@/shared/ui/badge";
import { useAppStore } from "@/shared/model/appStore";

export function StatusBadge() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);

  return (
    <Badge variant={connectionStatus === "online" ? "default" : "secondary"}>
      {connectionStatus === "online" ? "Online" : "Offline"}
    </Badge>
  );
}
