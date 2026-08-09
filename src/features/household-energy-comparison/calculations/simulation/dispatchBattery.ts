import type { StoragePlan } from './buildStoragePlan'
import type { BatteryDispatch } from 'features/household-energy-comparison/models/dispatches'
import { dispatchPeakBattery } from './dispatchPeakBattery'
import { dispatchOffPeakBattery } from './dispatchOffPeakBattery'

type DispatchBatteryProps = {
  hasBattery: boolean,
  isPeakHour: boolean,
  isCheapHour: boolean,
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan
}

export const dispatchBattery = ({
  hasBattery,
  isPeakHour,
  isCheapHour,
  remainingDemandKwh,
  surplusSolarKwh,
  evExportKwh,
  batteryStateOfChargeKwh,
  plan,
}: DispatchBatteryProps): BatteryDispatch => {
  if (!hasBattery) {
    return {
      batteryChargeKwh: 0,
      batteryDischargeKwh: 0,
      gridImportKwh: remainingDemandKwh,
      gridExportKwh: surplusSolarKwh + evExportKwh,
      batteryStateOfChargeKwh,
    }
  }
  if (isPeakHour) {
    return dispatchPeakBattery(
      remainingDemandKwh,
      surplusSolarKwh,
      evExportKwh,
      batteryStateOfChargeKwh,
      plan,
    )
  }
  return dispatchOffPeakBattery(
    isCheapHour,
    remainingDemandKwh,
    surplusSolarKwh,
    evExportKwh,
    batteryStateOfChargeKwh,
    plan,
  )
}
