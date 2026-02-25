import { create } from "zustand";
import type { SetlistTemplate, TemplateSegment } from "./types";

function calcDurations(segments: TemplateSegment[]): { full: number; short: number } {
  return segments.reduce(
    (acc, s) => ({
      full: acc.full + s.durationFull,
      short: acc.short + (s.durationShort ?? s.durationFull),
    }),
    { full: 0, short: 0 },
  );
}

const MOCK_TEMPLATES: SetlistTemplate[] = [
  {
    id: "tpl-1",
    name: "Quebonafide — Full Set",
    segments: [
      {
        id: "tpl1-seg-1",
        name: "Tatuaż",
        durationFull: 210,
        durationShort: 165,
        note: "Dobry opener",
      },
      { id: "tpl1-seg-2", name: "Candy", durationFull: 200, durationShort: 150, note: "" },
      { id: "tpl1-seg-3", name: "Bubbletea", durationFull: 180, durationShort: null, note: "" },
      { id: "tpl1-seg-4", name: "Jesień", durationFull: 240, durationShort: 180, note: "Ballada" },
      {
        id: "tpl1-seg-5",
        name: "Szubiepp",
        durationFull: 195,
        durationShort: null,
        note: "Hit + pyro",
      },
    ],
    note: "Standardowy set Quebo na hale",
    totalDurationFull: 1025,
    totalDurationShort: 870,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-02-15T14:00:00Z",
  },
  {
    id: "tpl-2",
    name: "Mata — Hala Tour",
    segments: [
      { id: "tpl2-seg-1", name: "Patoreakcja", durationFull: 195, durationShort: 150, note: "" },
      { id: "tpl2-seg-2", name: "Kiss cam", durationFull: 210, durationShort: 160, note: "" },
      {
        id: "tpl2-seg-3",
        name: "Mafia",
        durationFull: 230,
        durationShort: null,
        note: "Hit + pyro",
      },
      {
        id: "tpl2-seg-4",
        name: "Ostatni raz",
        durationFull: 250,
        durationShort: 180,
        note: "Ballada na koniec",
      },
    ],
    note: "Set Mata na trasę halową 2026",
    totalDurationFull: 885,
    totalDurationShort: 720,
    createdAt: "2026-01-20T12:00:00Z",
    updatedAt: "2026-02-20T09:30:00Z",
  },
  {
    id: "tpl-3",
    name: "Sobel — Napisz Jak Będziesz",
    segments: [
      {
        id: "tpl3-seg-1",
        name: "Impreza",
        durationFull: 200,
        durationShort: 155,
        note: "Opener energetyczny",
      },
      { id: "tpl3-seg-2", name: "Fiołkowe pole", durationFull: 220, durationShort: 170, note: "" },
      { id: "tpl3-seg-3", name: "Dwa serca", durationFull: 190, durationShort: null, note: "" },
      { id: "tpl3-seg-4", name: "Wszystko OK", durationFull: 205, durationShort: 160, note: "" },
      { id: "tpl3-seg-5", name: "Chwile", durationFull: 240, durationShort: 180, note: "Ballada" },
      {
        id: "tpl3-seg-6",
        name: "Na zawsze",
        durationFull: 180,
        durationShort: null,
        note: "Closer",
      },
    ],
    note: null,
    totalDurationFull: 1235,
    totalDurationShort: 1035,
    createdAt: "2026-02-01T15:00:00Z",
    updatedAt: "2026-02-22T11:00:00Z",
  },
];

export type TemplateSortOption = "newest" | "oldest" | "name-asc";

interface TemplatesState {
  templates: SetlistTemplate[];
  search: string;
  sort: TemplateSortOption;
  page: number;
  pageSize: number;

  setSearch: (search: string) => void;
  setSort: (sort: TemplateSortOption) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  fetchTemplates: () => void;
  createTemplate: (name: string) => SetlistTemplate;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, data: Partial<Omit<SetlistTemplate, "id" | "createdAt">>) => void;

  getFilteredTemplates: () => SetlistTemplate[];
  getPaginatedData: () => SetlistTemplate[];
  getTotalPages: () => number;
}

let nextTemplateId = 100;

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: MOCK_TEMPLATES,
  search: "",
  sort: "newest",
  page: 1,
  pageSize: 20,

  setSearch: (search) => set({ search, page: 1 }),
  setSort: (sort) => set({ sort }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  fetchTemplates: () => {
    set({ templates: MOCK_TEMPLATES });
  },

  createTemplate: (name) => {
    const now = new Date().toISOString();
    const template: SetlistTemplate = {
      id: `tpl-${nextTemplateId++}`,
      name,
      segments: [],
      note: null,
      totalDurationFull: 0,
      totalDurationShort: 0,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ templates: [template, ...state.templates] }));
    return template;
  },

  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),

  updateTemplate: (id, data) =>
    set((state) => ({
      templates: state.templates.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...data, updatedAt: new Date().toISOString() };
        if (data.segments) {
          const durations = calcDurations(data.segments);
          updated.totalDurationFull = durations.full;
          updated.totalDurationShort = durations.short;
        }
        return updated;
      }),
    })),

  getFilteredTemplates: () => {
    const { templates, search, sort } = get();
    let result = [...templates];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.segments.some((s) => s.name.toLowerCase().includes(q)),
      );
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name, "pl");
        default:
          return 0;
      }
    });

    return result;
  },

  getPaginatedData: () => {
    const { page, pageSize } = get();
    const filtered = get().getFilteredTemplates();
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  },

  getTotalPages: () => {
    const { pageSize } = get();
    const filtered = get().getFilteredTemplates();
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  },
}));
