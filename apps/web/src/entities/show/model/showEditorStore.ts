import { create } from "zustand";
import type { VenueType } from "@/entities/venue";
import { MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { findConflictingShow } from "./showSelectors";
import type { EditorSegment, SaveStatus } from "./types";

export interface ShowEditorState {
  // Identity
  showId: string | null;

  // Step tracking
  currentStep: 1 | 2 | 3;

  // Step 1: Show
  showName: string;
  artists: string[];
  genre: string;

  // Step 1: Schedule
  date: Date | undefined;
  startTime: string;
  endTime: string;
  curfew: string;

  // Step 1: Venue
  selectedVenueId: string | null;
  isCreatingNewVenue: boolean;
  newVenueName: string;
  venueType: VenueType | "";
  venueCapacity: string;
  venueCity: string;

  // Step 2: Segments
  segments: EditorSegment[];

  // Meta
  isDirty: boolean;
  saveStatus: SaveStatus;
  touchedFields: string[];

  // Actions — Navigation
  setCurrentStep: (step: 1 | 2 | 3) => void;

  // Actions — Show
  setShowName: (name: string) => void;
  addArtist: (artist: string) => void;
  removeArtist: (artist: string) => void;
  setGenre: (genre: string) => void;

  // Actions — Schedule
  setDate: (date: Date | undefined) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setCurfew: (time: string) => void;

  // Actions — Venue
  selectVenue: (venueId: string) => void;
  startNewVenue: () => void;
  setNewVenueName: (name: string) => void;
  setVenueType: (type: VenueType | "") => void;
  setVenueCapacity: (capacity: string) => void;
  setVenueCity: (city: string) => void;
  clearVenue: () => void;

  // Actions — Segments
  addSegment: () => void;
  removeSegment: (id: string) => void;
  updateSegment: (id: string, data: Partial<EditorSegment>) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  loadTemplate: (segments: EditorSegment[]) => void;
  importCSV: (segments: EditorSegment[]) => void;

  // Actions — Persistence
  save: () => Promise<void>;

  // Actions — Lifecycle
  loadShow: (showId: string, data: Partial<ShowEditorState>) => void;

  // Actions — Meta
  touchField: (field: string) => void;
  resetEditor: () => void;
}

let nextSegmentId = 1;

function generateSegmentId(): string {
  return `new-seg-${nextSegmentId++}`;
}

const defaultVenue = MOCK_VENUES[0];

const initialState = {
  showId: null as string | null,
  currentStep: 1 as const,
  showName: "",
  artists: [] as string[],
  genre: "",
  date: undefined as Date | undefined,
  startTime: "",
  endTime: "",
  curfew: "",
  selectedVenueId: defaultVenue?.id ?? null,
  isCreatingNewVenue: false,
  newVenueName: "",
  venueType: (defaultVenue?.type ?? "") as VenueType | "",
  venueCapacity: defaultVenue ? String(defaultVenue.capacity) : "",
  venueCity: defaultVenue?.city ?? "",
  segments: [] as EditorSegment[],
  isDirty: false,
  saveStatus: "saved" as SaveStatus,
  touchedFields: [] as string[],
};

function markDirty(state: Partial<ShowEditorState>): Partial<ShowEditorState> {
  return { ...state, isDirty: true, saveStatus: "unsaved" as const };
}

export const useShowEditorStore = create<ShowEditorState>((set, get) => ({
  ...initialState,

  // Navigation
  setCurrentStep: (step) => set({ currentStep: step }),

  // Show
  setShowName: (name) => set(markDirty({ showName: name })),

  addArtist: (artist) =>
    set((state) => {
      const trimmed = artist.trim();
      if (!trimmed || state.artists.includes(trimmed)) return state;
      return markDirty({ artists: [...state.artists, trimmed] }) as ShowEditorState;
    }),

  removeArtist: (artist) =>
    set(
      (state) =>
        markDirty({
          artists: state.artists.filter((a) => a !== artist),
        }) as ShowEditorState,
    ),

  setGenre: (genre) => set(markDirty({ genre })),

  // Schedule
  setDate: (date) => set(markDirty({ date })),
  setStartTime: (time) => set(markDirty({ startTime: time })),
  setEndTime: (time) => set(markDirty({ endTime: time })),
  setCurfew: (time) => set(markDirty({ curfew: time })),

  // Venue
  selectVenue: (venueId) => {
    const venue = MOCK_VENUES.find((v) => v.id === venueId);
    if (!venue) return;

    set(
      markDirty({
        selectedVenueId: venueId,
        isCreatingNewVenue: false,
        newVenueName: "",
        venueType: venue.type,
        venueCapacity: String(venue.capacity),
        venueCity: venue.city,
      }) as ShowEditorState,
    );
  },

  startNewVenue: () =>
    set(
      markDirty({
        selectedVenueId: null,
        isCreatingNewVenue: true,
        newVenueName: "",
        venueType: "",
        venueCapacity: "",
        venueCity: "",
      }) as ShowEditorState,
    ),

  setNewVenueName: (name) => set(markDirty({ newVenueName: name })),
  setVenueType: (type) => set(markDirty({ venueType: type })),
  setVenueCapacity: (capacity) => set(markDirty({ venueCapacity: capacity })),
  setVenueCity: (city) => set(markDirty({ venueCity: city })),

  clearVenue: () =>
    set(
      markDirty({
        selectedVenueId: null,
        isCreatingNewVenue: false,
        newVenueName: "",
        venueType: "",
        venueCapacity: "",
        venueCity: "",
      }) as ShowEditorState,
    ),

  // Segments
  addSegment: () =>
    set(
      (state) =>
        markDirty({
          segments: [
            ...state.segments,
            { id: generateSegmentId(), name: "", durationFull: 0, durationShort: null, note: "" },
          ],
        }) as ShowEditorState,
    ),

  removeSegment: (id) =>
    set(
      (state) =>
        markDirty({
          segments: state.segments.filter((s) => s.id !== id),
        }) as ShowEditorState,
    ),

  updateSegment: (id, data) =>
    set(
      (state) =>
        markDirty({
          segments: state.segments.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }) as ShowEditorState,
    ),

  reorderSegments: (fromIndex, toIndex) =>
    set((state) => {
      const segments = [...state.segments];
      const [moved] = segments.splice(fromIndex, 1);
      segments.splice(toIndex, 0, moved);
      return markDirty({ segments }) as ShowEditorState;
    }),

  loadTemplate: (segments) =>
    set((state) => markDirty({ segments: [...state.segments, ...segments] }) as ShowEditorState),

  importCSV: (segments) => set(markDirty({ segments }) as ShowEditorState),

  // Persistence
  save: async () => {
    const state = get();
    if (!state.isDirty) return;

    set({ saveStatus: "saving" });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Sync readiness with showsStore
      if (state.showId) {
        // Dynamic import to avoid circular dependency
        const { useShowsStore } = await import("./showsStore");
        const showsState = useShowsStore.getState();

        const detailsReady = isDetailsStepValid(state, showsState.shows);
        const setlistReady = state.segments.some((s) => s.name.trim() !== "" && s.durationFull > 0);
        const readiness = { details: detailsReady, setlist: setlistReady };
        const isReady = detailsReady && setlistReady;

        const currentShow = showsState.shows.find((s) => s.id === state.showId);

        // Build venue data for sync
        const venueData = state.selectedVenueId
          ? (() => {
              const v = MOCK_VENUES.find((v) => v.id === state.selectedVenueId);
              return v ? { name: v.name, city: v.city, type: v.type, capacity: v.capacity } : null;
            })()
          : state.isCreatingNewVenue && state.newVenueName.trim()
            ? {
                name: state.newVenueName,
                city: state.venueCity,
                type: (state.venueType || "indoor") as import("@/entities/venue").VenueType,
                capacity: Number(state.venueCapacity) || 0,
              }
            : null;

        const estimatedDuration = state.segments.reduce((sum, s) => sum + s.durationFull, 0);

        const syncData = {
          name: state.showName,
          date: state.date
            ? `${state.date.getFullYear()}-${String(state.date.getMonth() + 1).padStart(2, "0")}-${String(state.date.getDate()).padStart(2, "0")}`
            : "",
          startTime: state.startTime,
          endTime: state.endTime,
          curfew: state.curfew,
          venue: venueData,
          segmentCount: state.segments.length,
          duration: estimatedDuration > 0 ? estimatedDuration : null,
          artists: state.artists,
          genre: state.genre || null,
          readiness,
        };

        if (currentShow && currentShow.status === "SZKIC") {
          showsState.updateShow(state.showId, {
            ...syncData,
            status: isReady ? "GOTOWY" : "SZKIC",
          });
        } else if (currentShow) {
          showsState.updateShow(state.showId, syncData);
        }
      }

      set({ saveStatus: "saved", isDirty: false });
    } catch {
      set({ saveStatus: "error" });
    }
  },

  // Lifecycle
  loadShow: (showId, data) => {
    nextSegmentId = 1;
    set({
      ...initialState,
      showId,
      ...data,
      isDirty: false,
      saveStatus: "saved",
      touchedFields: [],
    });
  },

  // Meta
  touchField: (field) =>
    set((state) => {
      if (state.touchedFields.includes(field)) return state;
      return { touchedFields: [...state.touchedFields, field] };
    }),

  resetEditor: () => {
    nextSegmentId = 1;
    set({ ...initialState });
  },
}));

// Validation helpers (derived, not stored)
export interface DetailsValidationErrors {
  showName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  curfew?: string;
  venue?: string;
  dateTimeConflict?: string;
}

export function getDetailsValidationErrors(
  state: Pick<
    ShowEditorState,
    | "showId"
    | "showName"
    | "date"
    | "startTime"
    | "endTime"
    | "curfew"
    | "selectedVenueId"
    | "isCreatingNewVenue"
    | "newVenueName"
    | "touchedFields"
  >,
  allShows?: import("./types").DashboardShow[],
): DetailsValidationErrors {
  const errors: DetailsValidationErrors = {};
  const { touchedFields } = state;

  if (touchedFields.includes("showName") && !state.showName.trim()) {
    errors.showName = "Pole wymagane";
  }

  if (touchedFields.includes("date")) {
    if (!state.date) {
      errors.date = "Pole wymagane";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(state.date);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = "Data nie może być z przeszłości";
      }
    }
  }

  if (touchedFields.includes("startTime") && !state.startTime) {
    errors.startTime = "Pole wymagane";
  }

  if (touchedFields.includes("endTime")) {
    if (!state.endTime) {
      errors.endTime = "Pole wymagane";
    } else if (state.startTime && state.endTime <= state.startTime) {
      errors.endTime = "Koniec musi być po starcie";
    }
  }

  if (touchedFields.includes("curfew")) {
    if (!state.curfew) {
      errors.curfew = "Pole wymagane";
    } else if (state.endTime && state.curfew < state.endTime) {
      errors.curfew = "Curfew nie może być przed planowanym końcem";
    }
  }

  if (touchedFields.includes("venue") && state.isCreatingNewVenue && !state.newVenueName.trim()) {
    errors.venue = "Podaj nazwę nowego obiektu";
  }

  // Duplicate date+time conflict check
  if (allShows && state.date && state.startTime && state.showId) {
    const dateStr = `${state.date.getFullYear()}-${String(state.date.getMonth() + 1).padStart(2, "0")}-${String(state.date.getDate()).padStart(2, "0")}`;
    const conflict = findConflictingShow(dateStr, state.startTime, state.showId, allShows);
    if (conflict) {
      errors.dateTimeConflict = conflict.name || "Bez nazwy";
    }
  }

  return errors;
}

export function isDetailsStepValid(
  state: Pick<
    ShowEditorState,
    | "showId"
    | "showName"
    | "date"
    | "startTime"
    | "endTime"
    | "curfew"
    | "selectedVenueId"
    | "isCreatingNewVenue"
    | "newVenueName"
  >,
  allShows?: import("./types").DashboardShow[],
): boolean {
  if (!state.showName.trim()) return false;
  if (!state.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(state.date);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) return false;
  if (!state.startTime) return false;
  if (!state.endTime) return false;
  if (!state.curfew) return false;
  if (state.endTime <= state.startTime) return false;
  if (state.curfew < state.endTime) return false;

  if (state.isCreatingNewVenue && !state.newVenueName.trim()) return false;

  // Block if conflicting show exists
  if (allShows && state.showId && state.date && state.startTime) {
    const dateStr = `${state.date.getFullYear()}-${String(state.date.getMonth() + 1).padStart(2, "0")}-${String(state.date.getDate()).padStart(2, "0")}`;
    const conflict = findConflictingShow(dateStr, state.startTime, state.showId, allShows);
    if (conflict) return false;
  }

  return true;
}
