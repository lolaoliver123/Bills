export type HourlyEnergyFlow = {
  hour: number
  electricityDemandKwh: number
  heatPumpDemandKwh: number
  evChargeKwh: number
  evDischargeKwh: number
  solarGenerationKwh: number
  batteryChargeKwh: number
  batteryDischargeKwh: number
  gridImportKwh: number
  gridExportKwh: number
  batteryStateOfChargeKwh: number
}

export type SimulationOptions = {
  demandScale?: number
  tariff?: import('./billing').ElectricityTariff
}

export type EnergyProfiles = {
  heatPumpDemandKwh: number[]
  evChargeKwh: number[]
  electricityDemandKwh: number[]
  solarGenerationKwh: number[]
}