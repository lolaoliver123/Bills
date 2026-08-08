export const BATTERY_ASSUMPTIONS = {
  maxChargeKwPerUnit: 5,
  maxDischargeKwPerUnit: 5,
  chargeEfficiency: 0.95,
  dischargeEfficiency: 0.95,
  reserveFraction: 0.1,
  cheapChargeTargetFraction: 0.5,
  cheapStartHour: 0,
  cheapEndHour: 5,
  peakStartHour: 16,
  peakEndHour: 19,
} as const

export const REFERENCE_SOLAR_KW = 4.8
export const REFERENCE_HEAT_PUMP_KW = 8
export const REFERENCE_EV_CAPACITY_KWH = 50
export const REFERENCE_EV_CHARGES_PER_WEEK = 2

// Representative energy consumed during each one-hour interval, in Wh.
export const GENERAL_ELECTRICITY_WH = [
  160, 140, 130, 130, 140, 180, 420, 520, 380, 250, 220, 230, 300, 280, 230, 240, 300, 520, 680,
  720, 560, 380, 240, 180,
]
export const HEAT_PUMP_ELECTRICITY_WH = [
  220, 200, 190, 180, 200, 300, 620, 760, 520, 300, 220, 180, 170, 170, 180, 220, 300, 520, 760,
  880, 720, 500, 340, 260,
]
export const REFERENCE_SOLAR_GENERATION_WH = [
  0, 0, 0, 0, 0, 0, 0, 0, 120, 360, 620, 850, 980, 900, 700, 460, 220, 60, 0, 0, 0, 0, 0, 0,
]
export const EV_CHARGING_WH = [
  3570, 3570, 3570, 3570, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]
