export type StoragePlan = {
  batteryCapacityKwh: number
  batteryReserveKwh: number
  maxBatteryChargeKwh: number
  maxBatteryDischargeKwh: number
  cheapChargeTargetKwh: number
  batteryHomeDischargeProfitable: boolean
  batteryExportProfitable: boolean
  shouldStoreSolar: boolean
  evCapacityKwh: number
  evReserveKwh: number
  evHomeDischargeProfitable: boolean
  evExportProfitable: boolean
}

export type DesiredPeakStorageOptions = {
  batteryReserveKwh: number
  peakDispatchableStoredKwh: number
  forecastPeakDemandKwh: number
  batteryExportProfitable: boolean
  batteryHomeDischargeProfitable: boolean
}
