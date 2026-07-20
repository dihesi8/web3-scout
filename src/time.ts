/**
 * Returns true if the given timestamp (ms since epoch) is within the last
 * `hours` hours. Used to keep the scan focused on genuinely fresh activity
 * rather than re-surfacing the same old profiles/casts every run.
 */
export function isWithinLastHours(timestampMs: number, hours = 24): boolean {
  if (!timestampMs || Number.isNaN(timestampMs)) return false;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return timestampMs >= cutoff;
}
