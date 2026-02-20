import type { Segment, Setlist } from "@/entities/segment";
import type { Show } from "@/entities/show";
import type { CalibrationPreset, Venue } from "@/entities/venue";

// --- Venues ---

export const MOCK_VENUES: Venue[] = [
  {
    id: "venue-1",
    name: "Teatr Wielki",
    type: "hall",
    capacity: 3000,
    city: "Warszawa",
  },
  {
    id: "venue-2",
    name: "Atlas Arena",
    type: "hall",
    capacity: 13000,
    city: "Łódź",
  },
  {
    id: "venue-3",
    name: "Ergo Arena",
    type: "hall",
    capacity: 11000,
    city: "Gdańsk",
  },
  {
    id: "venue-4",
    name: "Progresja",
    type: "club",
    capacity: 1800,
    city: "Warszawa",
  },
];

// --- Calibration Presets ---

export const MOCK_CALIBRATION_PRESETS: CalibrationPreset[] = [
  {
    id: "preset-1",
    name: "Hip-hop / Hala 3000-8000",
    venue_type: "hall",
    capacity_min: 3000,
    capacity_max: 8000,
    genre: "hip-hop",
    energy_baseline: 0.45,
    energy_sensitivity: 0.65,
    crowd_noise_floor: 0.15,
  },
  {
    id: "preset-2",
    name: "Rock / Stadion 10000+",
    venue_type: "stadium",
    capacity_min: 10000,
    capacity_max: 80000,
    genre: "rock",
    energy_baseline: 0.55,
    energy_sensitivity: 0.5,
    crowd_noise_floor: 0.25,
  },
  {
    id: "preset-3",
    name: "Electronic / Klub do 3000",
    venue_type: "club",
    capacity_min: 200,
    capacity_max: 3000,
    genre: "electronic",
    energy_baseline: 0.6,
    energy_sensitivity: 0.8,
    crowd_noise_floor: 0.3,
  },
  {
    id: "preset-4",
    name: "Pop / Open Air 5000+",
    venue_type: "open_air",
    capacity_min: 5000,
    capacity_max: 50000,
    genre: "pop",
    energy_baseline: 0.4,
    energy_sensitivity: 0.55,
    crowd_noise_floor: 0.2,
  },
];

// --- Segments for second setlist (Mata) ---

const MATA_SEGMENTS: Segment[] = [
  {
    id: "mata-seg-1",
    name: "Patoreakcja",
    position: 1,
    type: "song",
    bpm: 105,
    genre: "hip-hop",
    expected_energy: 0.7,
    is_locked: false,
    is_skippable: true,
    has_pyro: false,
    variants: [
      { id: "mata-var-1a", variant_type: "full", duration_seconds: 195 },
      { id: "mata-var-1b", variant_type: "short", duration_seconds: 150 },
    ],
  },
  {
    id: "mata-seg-2",
    name: "Kiss cam",
    position: 2,
    type: "song",
    bpm: 120,
    genre: "hip-hop",
    expected_energy: 0.85,
    is_locked: false,
    is_skippable: false,
    has_pyro: false,
    variants: [
      { id: "mata-var-2a", variant_type: "full", duration_seconds: 210 },
      { id: "mata-var-2b", variant_type: "short", duration_seconds: 160 },
    ],
  },
  {
    id: "mata-seg-3",
    name: "Mafia",
    position: 3,
    type: "song",
    bpm: 95,
    genre: "hip-hop",
    expected_energy: 0.75,
    is_locked: true,
    is_skippable: false,
    has_pyro: true,
    notes: "Kontraktowy hit + pyro",
    variants: [{ id: "mata-var-3a", variant_type: "full", duration_seconds: 230 }],
  },
  {
    id: "mata-seg-4",
    name: "Ostatni raz",
    position: 4,
    type: "song",
    bpm: 80,
    genre: "hip-hop",
    expected_energy: 0.4,
    is_locked: false,
    is_skippable: true,
    has_pyro: false,
    notes: "Ballada na zakończenie",
    variants: [
      { id: "mata-var-4a", variant_type: "full", duration_seconds: 250 },
      { id: "mata-var-4b", variant_type: "short", duration_seconds: 180 },
    ],
  },
];

// --- Setlists ---

export const MOCK_SETLISTS: Setlist[] = [
  {
    id: "setlist-1",
    name: "Quebonafide — Full Set",
    segments: [
      {
        id: "seg-1",
        name: "Tatuaż",
        position: 1,
        type: "song",
        bpm: 90,
        genre: "hip-hop",
        expected_energy: 0.6,
        is_locked: false,
        is_skippable: true,
        has_pyro: false,
        notes: "Dobry opener, buduje energię",
        variants: [
          { id: "var-1a", variant_type: "full", duration_seconds: 210 },
          { id: "var-1b", variant_type: "short", duration_seconds: 165 },
        ],
      },
      {
        id: "seg-2",
        name: "Candy",
        position: 2,
        type: "song",
        bpm: 110,
        genre: "hip-hop",
        expected_energy: 0.8,
        is_locked: false,
        is_skippable: false,
        has_pyro: false,
        variants: [
          { id: "var-2a", variant_type: "full", duration_seconds: 200 },
          { id: "var-2b", variant_type: "short", duration_seconds: 150 },
        ],
      },
      {
        id: "seg-3",
        name: "Bubbletea",
        position: 3,
        type: "song",
        bpm: 100,
        genre: "hip-hop",
        expected_energy: 0.7,
        is_locked: false,
        is_skippable: false,
        has_pyro: false,
        variants: [{ id: "var-3a", variant_type: "full", duration_seconds: 180 }],
      },
      {
        id: "seg-4",
        name: "Jesień",
        position: 4,
        type: "song",
        bpm: 75,
        genre: "hip-hop",
        expected_energy: 0.4,
        is_locked: false,
        is_skippable: true,
        has_pyro: false,
        notes: "Ballada — kontrast energetyczny",
        variants: [
          { id: "var-4a", variant_type: "full", duration_seconds: 240 },
          { id: "var-4b", variant_type: "short", duration_seconds: 180 },
        ],
      },
      {
        id: "seg-5",
        name: "Szubiepp",
        position: 5,
        type: "song",
        bpm: 130,
        genre: "hip-hop",
        expected_energy: 0.95,
        is_locked: true,
        is_skippable: false,
        has_pyro: true,
        notes: "Kontraktowy hit + pirotechnika załadowana",
        variants: [{ id: "var-5a", variant_type: "full", duration_seconds: 195 }],
      },
    ],
    total_planned_duration_seconds: 1025,
  },
  {
    id: "setlist-2",
    name: "Mata — Hala Tour",
    segments: MATA_SEGMENTS,
    total_planned_duration_seconds: 885,
  },
];

// --- Previous Shows (for cloning in Setup step 1) ---

export const MOCK_PREVIOUS_SHOWS: Show[] = [
  {
    id: "prev-show-1",
    name: "Quebonafide — Gdańsk 10.05.2026",
    status: "ended",
    scheduled_start: "2026-05-10T20:00:00",
    curfew: "2026-05-10T23:00:00",
    actual_start: "2026-05-10T20:05:00",
    venue: MOCK_VENUES[2],
    setlist: MOCK_SETLISTS[0],
  },
  {
    id: "prev-show-2",
    name: "Mata — Kraków 03.05.2026",
    status: "ended",
    scheduled_start: "2026-05-03T19:30:00",
    curfew: "2026-05-03T22:30:00",
    actual_start: "2026-05-03T19:35:00",
    venue: {
      id: "venue-krakow",
      name: "Tauron Arena",
      type: "hall",
      capacity: 15000,
      city: "Kraków",
    },
    setlist: MOCK_SETLISTS[1],
  },
  {
    id: "prev-show-3",
    name: "Quebonafide — Warszawa 25.04.2026",
    status: "ended",
    scheduled_start: "2026-04-25T20:00:00",
    curfew: "2026-04-25T23:00:00",
    actual_start: "2026-04-25T20:00:00",
    venue: MOCK_VENUES[0],
    setlist: MOCK_SETLISTS[0],
  },
];
