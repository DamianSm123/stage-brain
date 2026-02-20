import { create } from "zustand";
import type { Segment } from "@/entities/segment";
import type { VenueType } from "@/entities/venue";
import { MOCK_CALIBRATION_PRESETS, MOCK_SETLISTS, MOCK_VENUES } from "@/shared/lib/mock-setup-data";

export interface CalibrationValues {
  energy_baseline: number;
  energy_sensitivity: number;
  crowd_noise_floor: number;
}

interface NewVenue {
  name: string;
  type: VenueType;
  capacity: number;
  city: string;
}

export interface SetupState {
  currentStep: number;

  // Step 1
  showName: string;
  showDate: string;
  scheduledStart: string;
  curfew: string;

  // Step 2
  selectedVenueId: string | null;
  newVenue: NewVenue | null;
  calibrationPresetId: string | null;
  calibration: CalibrationValues;

  // Step 3 (terminal S-2 will fill)
  selectedSetlistId: string | null;
  editableSegments: Segment[];

  // Actions
  setCurrentStep: (step: number) => void;
  updateShowInfo: (
    partial: Partial<Pick<SetupState, "showName" | "showDate" | "scheduledStart" | "curfew">>,
  ) => void;
  selectVenue: (venueId: string) => void;
  setNewVenue: (venue: NewVenue | null) => void;
  selectCalibrationPreset: (presetId: string) => void;
  updateCalibration: (partial: Partial<CalibrationValues>) => void;
  setEditableSegments: (segments: Segment[]) => void;
  selectSetlist: (setlistId: string) => void;
  resetSetup: () => void;
}

const initialCalibration: CalibrationValues = {
  energy_baseline: 0.5,
  energy_sensitivity: 0.5,
  crowd_noise_floor: 0.2,
};

const initialState = {
  currentStep: 1,
  showName: "",
  showDate: "",
  scheduledStart: "",
  curfew: "",
  selectedVenueId: null,
  newVenue: null,
  calibrationPresetId: null,
  calibration: initialCalibration,
  selectedSetlistId: null,
  editableSegments: [],
};

export const useSetupStore = create<SetupState>((set) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  updateShowInfo: (partial) => set(partial),

  selectVenue: (venueId) => {
    const venue = MOCK_VENUES.find((v) => v.id === venueId);
    if (!venue) return;

    const matchingPreset = MOCK_CALIBRATION_PRESETS.find(
      (p) =>
        p.venue_type === venue.type &&
        venue.capacity >= p.capacity_min &&
        venue.capacity <= p.capacity_max,
    );

    set({
      selectedVenueId: venueId,
      newVenue: null,
      ...(matchingPreset
        ? {
            calibrationPresetId: matchingPreset.id,
            calibration: {
              energy_baseline: matchingPreset.energy_baseline,
              energy_sensitivity: matchingPreset.energy_sensitivity,
              crowd_noise_floor: matchingPreset.crowd_noise_floor,
            },
          }
        : {}),
    });
  },

  setNewVenue: (venue) =>
    set({
      newVenue: venue,
      selectedVenueId: null,
    }),

  selectCalibrationPreset: (presetId) => {
    const preset = MOCK_CALIBRATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    set({
      calibrationPresetId: presetId,
      calibration: {
        energy_baseline: preset.energy_baseline,
        energy_sensitivity: preset.energy_sensitivity,
        crowd_noise_floor: preset.crowd_noise_floor,
      },
    });
  },

  updateCalibration: (partial) =>
    set((state) => ({
      calibration: { ...state.calibration, ...partial },
    })),

  setEditableSegments: (segments) => set({ editableSegments: segments }),

  selectSetlist: (setlistId) => {
    const setlist = MOCK_SETLISTS.find((s) => s.id === setlistId);
    set({
      selectedSetlistId: setlistId,
      editableSegments: setlist
        ? setlist.segments.map((s) => ({
            ...s,
            variants: s.variants.map((v) => ({ ...v })),
          }))
        : [],
    });
  },

  resetSetup: () => set({ ...initialState }),
}));
