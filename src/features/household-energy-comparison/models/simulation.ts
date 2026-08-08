export type HourlyEnergyFlow = {
  hour: number
  electricityDemandKwh: number
  heatPumpDemandKwh: number
  solarGenerationKwh: number
  batteryChargeKwh: number
  batteryDischargeKwh: number
  gridImportKwh: number
  gridExportKwh: number
  batteryStateOfChargeKwh: number
}

export type SimulationOptions = {
  demandScale?: number
}
