import { create } from "zustand";

type ConnectionStatus = "online" | "offline";

interface AppState {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useAppStore = create<AppState>((set) => ({
  connectionStatus: "offline",
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
