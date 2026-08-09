export type SolarSystem = {
  panelCount: number
  panelCapacityKw: number
}

export type BatterySystem = {
  unitCount: number
  unitCapacityKwh: number
}

export type EnergyAssets = {
  solar?: SolarSystem
  battery?: BatterySystem
}

export const PROPOSED_SOLAR_PANEL_CAPACITY_KW = 0.4

export const getSolarCapacityKw = (system: SolarSystem): number =>
  system.panelCount * system.panelCapacityKw

export const getBatteryCapacityKwh = (system: BatterySystem): number =>
  system.unitCount * system.unitCapacityKwh
