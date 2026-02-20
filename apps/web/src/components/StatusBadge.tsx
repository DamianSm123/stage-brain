import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";

export function StatusBadge() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);

  return (
    <Badge variant={connectionStatus === "online" ? "default" : "secondary"}>
      {connectionStatus === "online" ? "Online" : "Offline"}
    </Badge>
  );
}
