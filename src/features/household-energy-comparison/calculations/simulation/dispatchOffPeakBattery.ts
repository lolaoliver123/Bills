import type { StoragePlan } from './buildStoragePlan'
import { BATTERY_ASSUMPTIONS } from './config'
import type { BatteryDispatch } from 'features/household-energy-comparison/models/dispatches'

export const dispatchOffPeakBattery = (
  isCheapHour: boolean,
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan,
): BatteryDispatch => {
  const solarChargeKwh = plan.shouldStoreSolar
    ? Math.min(
        surplusSolarKwh,
        plan.maxBatteryChargeKwh,
        Math.max(0, plan.batteryCapacityKwh - batteryStateOfChargeKwh) /
          BATTERY_ASSUMPTIONS.chargeEfficiency,
      )
    : 0
  const stateOfChargeAfterSolarKwh =
    batteryStateOfChargeKwh + solarChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
  const gridChargeKwh = isCheapHour
    ? Math.min(
        plan.maxBatteryChargeKwh - solarChargeKwh,
        Math.max(0, plan.cheapChargeTargetKwh - stateOfChargeAfterSolarKwh) /
          BATTERY_ASSUMPTIONS.chargeEfficiency,
      )
    : 0

  return {
    batteryChargeKwh: solarChargeKwh + gridChargeKwh,
    batteryDischargeKwh: 0,
    gridImportKwh: remainingDemandKwh + gridChargeKwh,
    gridExportKwh: surplusSolarKwh - solarChargeKwh + evExportKwh,
    batteryStateOfChargeKwh:
      stateOfChargeAfterSolarKwh + gridChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency,
  }
}
