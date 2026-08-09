import type { StoragePlan } from './buildStoragePlan'
import { BATTERY_ASSUMPTIONS } from './config'
import type { BatteryDispatch } from 'features/household-energy-comparison/models/dispatches'

export const dispatchPeakBattery = (
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan,
): BatteryDispatch => {
  const availableDischargeKwh = Math.min(
    plan.maxBatteryDischargeKwh,
    Math.max(0, batteryStateOfChargeKwh - plan.batteryReserveKwh) *
      BATTERY_ASSUMPTIONS.dischargeEfficiency,
  )
  const dischargeToHomeKwh = plan.batteryHomeDischargeProfitable
    ? Math.min(remainingDemandKwh, availableDischargeKwh)
    : 0
  const dischargeToGridKwh = plan.batteryExportProfitable
    ? availableDischargeKwh - dischargeToHomeKwh
    : 0
  const batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh

  return {
    batteryChargeKwh: 0,
    batteryDischargeKwh,
    gridImportKwh: remainingDemandKwh - dischargeToHomeKwh,
    gridExportKwh: surplusSolarKwh + evExportKwh + dischargeToGridKwh,
    batteryStateOfChargeKwh:
      batteryStateOfChargeKwh - batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency,
  }
}
