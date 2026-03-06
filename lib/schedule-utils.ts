export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

export function getTimeWindowError(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string | null {
  if (!startTime || !endTime) return null

  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)
  if (startMinutes == null || endMinutes == null) {
    return 'Times must use HH:MM format.'
  }

  if (endMinutes <= startMinutes) {
    return 'End time must be after start time.'
  }

  return null
}

export function timesOverlap(
  aStart: string | null | undefined,
  aEnd: string | null | undefined,
  bStart: string | null | undefined,
  bEnd: string | null | undefined
): boolean {
  const aStartMinutes = parseTimeToMinutes(aStart)
  const aEndMinutes = parseTimeToMinutes(aEnd)
  const bStartMinutes = parseTimeToMinutes(bStart)
  const bEndMinutes = parseTimeToMinutes(bEnd)

  if (
    aStartMinutes == null ||
    aEndMinutes == null ||
    bStartMinutes == null ||
    bEndMinutes == null
  ) {
    return false
  }

  return aStartMinutes < bEndMinutes && bStartMinutes < aEndMinutes
}
