import { DEFAULT_ELECTRICITY_TARIFF } from './billing/config'

const HOURS_PER_DAY = 24

export type HourWindowSegment = {
  startHour: number
  endHour: number
}

export const isHourInWindow = (hour: number, startHour: number, endHour: number): boolean => {
  if (startHour === endHour) return false
  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour
}

export const getHoursInWindow = (startHour: number, endHour: number): number[] =>
  Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour).filter((hour) =>
    isHourInWindow(hour, startHour, endHour),
  )

export const getHourWindowSegments = (startHour: number, endHour: number): HourWindowSegment[] => {
  if (startHour === endHour) return []
  if (startHour < endHour) return [{ startHour, endHour }]
  return [
    { startHour, endHour: HOURS_PER_DAY },
    { startHour: 0, endHour },
  ]
}

export const getImportRate = (hour: number, tariff = DEFAULT_ELECTRICITY_TARIFF): number =>
  isHourInWindow(hour, tariff.nightStartHour, tariff.nightEndHour)
    ? tariff.nightImportGbpPerKwh
    : tariff.dayImportGbpPerKwh

export const getExportRate = (hour: number, tariff = DEFAULT_ELECTRICITY_TARIFF): number =>
  isHourInWindow(hour, tariff.peakExportStartHour, tariff.peakExportEndHour)
    ? tariff.peakExportGbpPerKwh
    : tariff.exportGbpPerKwh
