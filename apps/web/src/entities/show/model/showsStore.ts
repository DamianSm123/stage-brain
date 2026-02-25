import { create } from "zustand";
import { MOCK_DASHBOARD_SHOWS } from "@/shared/lib/mock-dashboard-data";
import { getShowUrgency } from "./showSelectors";
import type { DashboardShow, DashboardShowStatus } from "./types";

export type SortOption = "newest" | "oldest" | "name-asc" | "closest-date";

let nextShowId = 100;

interface ShowsState {
  shows: DashboardShow[];
  search: string;
  statusFilter: DashboardShowStatus | null;
  sort: SortOption;
  page: number;
  pageSize: number;

  setSearch: (search: string) => void;
  setStatusFilter: (status: DashboardShowStatus | null) => void;
  setSort: (sort: SortOption) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  fetchShows: () => void;
  createShow: () => DashboardShow;
  updateShow: (id: string, data: Partial<DashboardShow>) => void;
  deleteShow: (id: string) => void;

  getFilteredShows: () => DashboardShow[];
  getPaginatedData: () => DashboardShow[];
  getUpcoming: () => DashboardShow[];
  getCompleted: () => DashboardShow[];
  getTotalPages: () => number;
}

function filterAndSort(
  shows: DashboardShow[],
  search: string,
  statusFilter: DashboardShowStatus | null,
  sort: SortOption,
): DashboardShow[] {
  let result = [...shows];

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.venue?.name.toLowerCase().includes(q) ||
        s.venue?.city.toLowerCase().includes(q) ||
        s.artists.some((a) => a.toLowerCase().includes(q)),
    );
  }

  if (statusFilter) {
    result = result.filter((s) => s.status === statusFilter);
  }

  result.sort((a, b) => {
    // Boost urgent shows to top for newest and closest-date sorts
    if (sort === "newest" || sort === "closest-date") {
      const urgencyWeight = { imminent: 2, soon: 1, today: 0 } as const;
      const ua = getShowUrgency(a);
      const ub = getShowUrgency(b);
      const wa = ua ? urgencyWeight[ua] : -1;
      const wb = ub ? urgencyWeight[ub] : -1;
      if (wa !== wb) return wb - wa;
    }

    switch (sort) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "name-asc":
        return a.name.localeCompare(b.name, "pl");
      case "closest-date":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      default:
        return 0;
    }
  });

  return result;
}

export const useShowsStore = create<ShowsState>((set, get) => ({
  shows: MOCK_DASHBOARD_SHOWS,
  search: "",
  statusFilter: null,
  sort: "newest",
  page: 1,
  pageSize: 20,

  setSearch: (search) => set({ search, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setSort: (sort) => set({ sort }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  fetchShows: () => {
    set({ shows: MOCK_DASHBOARD_SHOWS });
  },

  createShow: () => {
    const now = new Date().toISOString();
    const show: DashboardShow = {
      id: `show-new-${nextShowId++}`,
      name: "",
      venue: null,
      date: "",
      startTime: "",
      endTime: "",
      curfew: "",
      status: "SZKIC",
      segmentCount: 0,
      duration: null,
      delta: null,
      engagement: null,
      artists: [],
      genre: null,
      readiness: { details: false, setlist: false },
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ shows: [show, ...state.shows] }));
    return show;
  },

  updateShow: (id, data) =>
    set((state) => ({
      shows: state.shows.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s,
      ),
    })),

  deleteShow: (id) =>
    set((state) => ({
      shows: state.shows.filter((s) => s.id !== id),
    })),

  getFilteredShows: () => {
    const { shows, search, statusFilter, sort } = get();
    return filterAndSort(shows, search, statusFilter, sort);
  },

  getPaginatedData: () => {
    const { shows, search, statusFilter, sort, page, pageSize } = get();
    const filtered = filterAndSort(shows, search, statusFilter, sort);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  },

  getUpcoming: () => {
    const { shows, search, statusFilter, sort } = get();
    const filtered = filterAndSort(shows, search, statusFilter, sort);
    return filtered.filter((s) => s.status !== "ZAKONCZONY");
  },

  getCompleted: () => {
    const { shows, search, statusFilter, sort } = get();
    const filtered = filterAndSort(shows, search, statusFilter, sort);
    return filtered.filter((s) => s.status === "ZAKONCZONY");
  },

  getTotalPages: () => {
    const { shows, search, statusFilter, sort, pageSize } = get();
    const filtered = filterAndSort(shows, search, statusFilter, sort);
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  },
}));
