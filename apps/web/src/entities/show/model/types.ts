import type { Setlist } from "@/entities/segment";
import type { Venue } from "@/entities/venue";

export type ShowStatus = "setup" | "live" | "paused" | "ended";

export interface Show {
  id: string;
  name: string;
  status: ShowStatus;
  scheduled_start: string;
  curfew: string;
  actual_start?: string;
  venue: Venue;
  setlist: Setlist;
}
