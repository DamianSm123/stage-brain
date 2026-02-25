export interface TemplateSegment {
  id: string;
  name: string;
  durationFull: number;
  durationShort: number | null;
  note: string;
}

export interface SetlistTemplate {
  id: string;
  name: string;
  segments: TemplateSegment[];
  note: string | null;
  totalDurationFull: number;
  totalDurationShort: number;
  createdAt: string;
  updatedAt: string;
}
