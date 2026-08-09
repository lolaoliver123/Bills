import { describe, expect, it } from 'vitest'
import {
  getHourWindowSegments,
  getHoursInWindow,
  getImportRate,
  isHourInWindow,
} from 'features/household-energy-comparison/calculations/tariff'
import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'

describe('tariff hour windows', () => {
  it('includes the start and excludes the end of a same-day window', () => {
    expect(isHourInWindow(15, 16, 19)).toBe(false)
    expect(isHourInWindow(16, 16, 19)).toBe(true)
    expect(isHourInWindow(18, 16, 19)).toBe(true)
    expect(isHourInWindow(19, 16, 19)).toBe(false)
  })

  it('supports a window that crosses midnight', () => {
    expect(getHoursInWindow(22, 2)).toEqual([0, 1, 22, 23])
    expect(isHourInWindow(23, 22, 2)).toBe(true)
    expect(isHourInWindow(1, 22, 2)).toBe(true)
    expect(isHourInWindow(12, 22, 2)).toBe(false)
  })

  it('treats matching boundaries as an empty window', () => {
    expect(getHoursInWindow(7, 7)).toEqual([])
    expect(getHourWindowSegments(7, 7)).toEqual([])
  })

  it('splits a midnight-crossing window for chart rendering', () => {
    expect(getHourWindowSegments(22, 2)).toEqual([
      { startHour: 22, endHour: 24 },
      { startHour: 0, endHour: 2 },
    ])
  })

  it('uses the cheap import rate on both sides of midnight', () => {
    const tariff = {
      ...DEFAULT_ELECTRICITY_TARIFF,
      nightStartHour: 22,
      nightEndHour: 2,
    }

    expect(getImportRate(23, tariff)).toBe(tariff.nightImportGbpPerKwh)
    expect(getImportRate(1, tariff)).toBe(tariff.nightImportGbpPerKwh)
    expect(getImportRate(12, tariff)).toBe(tariff.dayImportGbpPerKwh)
  })
})
