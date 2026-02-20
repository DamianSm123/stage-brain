export type VenueType = "hall" | "stadium" | "club" | "open_air";

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  capacity: number;
  city: string;
}

export interface CalibrationPreset {
  id: string;
  name: string;
  venue_type: VenueType;
  capacity_min: number;
  capacity_max: number;
  genre: string;
  energy_baseline: number;
  energy_sensitivity: number;
  crowd_noise_floor: number;
}
