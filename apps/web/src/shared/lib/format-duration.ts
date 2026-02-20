export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function parseDuration(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const parts = trimmed.split(":");
  if (parts.length === 2) {
    const minutes = Number.parseInt(parts[0], 10) || 0;
    const seconds = Number.parseInt(parts[1], 10) || 0;
    return minutes * 60 + seconds;
  }

  const asNumber = Number.parseInt(trimmed, 10);
  return Number.isNaN(asNumber) ? 0 : asNumber;
}
