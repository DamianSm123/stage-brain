export type VenueType = "hall" | "stadium" | "club" | "open_air";

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  capacity: number;
  city: string;
}
