/**
 * Parse "YYYY-MM-DD" as local calendar date (no UTC shift).
 * Use for display and day-of-week so dates match the real calendar.
 */
export function parseLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d)
}

/**
 * Parse a date string (YYYY-MM-DD or ISO with time) as local date.
 * Returns null if the value is missing or invalid (avoids Invalid time value).
 */
export function parseLocalDateSafe(value: string | null | undefined): Date | null {
  if (value == null || typeof value !== 'string' || !value.trim()) return null
  const dateKey = value.trim().slice(0, 10)
  const [y, m, d] = dateKey.split('-').map(Number)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/**
 * Format a Date as "YYYY-MM-DD" using local calendar values.
 * Use in API so returned dates don't shift by timezone.
 */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
