import type { HourlyEnergyFlow } from './simulation'

export type EvDispatch = {
  remainingDemandKwh: number
  evDischargeKwh: number
  evExportKwh: number
  evStateOfChargeKwh: number
}

export type BatteryDispatch = {
  batteryChargeKwh: number
  batteryDischargeKwh: number
  gridImportKwh: number
  gridExportKwh: number
  batteryStateOfChargeKwh: number
}

export type DispatchState = {
  flows: HourlyEnergyFlow[]
  evStateOfChargeKwh: number
  batteryStateOfChargeKwh: number
}