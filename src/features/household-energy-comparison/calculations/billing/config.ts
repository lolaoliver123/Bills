import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'

export const DEFAULT_ELECTRICITY_TARIFF: ElectricityTariff = {
  nightImportGbpPerKwh: 0.12,
  dayImportGbpPerKwh: 0.3161,
  exportGbpPerKwh: 0.09,
  peakExportGbpPerKwh: 0.16,
  standingChargeGbpPerDay: 0.5695,
  nightStartHour: 0,
  nightEndHour: 7,
  peakExportStartHour: 16,
  peakExportEndHour: 19,
  effectivePeriod: 'Illustrative smart import/export tariff',
}

export const DAYS_PER_YEAR = 365
export const MONTHS_PER_YEAR = 12

export const CALIBRATION_TOLERANCE_GBP = 0.0001
export const CALIBRATION_ITERATIONS = 60
export const MAX_DEMAND_SCALE = 1024
