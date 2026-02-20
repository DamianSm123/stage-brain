import { useAppStore } from "@/shared/model/appStore";

export function SystemStatus() {
  const connectionStatus = useAppStore((s) => s.connectionStatus);
  const isOnline = connectionStatus === "online";

  return (
    <div className="flex items-center" title={isOnline ? "System online" : "System offline"}>
      <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
    </div>
  );
}
