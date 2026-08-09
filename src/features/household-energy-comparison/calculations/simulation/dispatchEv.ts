import type { StoragePlan } from 'features/household-energy-comparison/models/storage'
import { EV_ASSUMPTIONS } from './config'
import type { EvDispatch } from 'features/household-energy-comparison/models/dispatches'

export const dispatchEv = (
  canSupplyGrid: boolean,
  isPeakHour: boolean,
  evChargeKwh: number,
  remainingDemandKwh: number,
  evStateOfChargeKwh: number,
  plan: StoragePlan,
): EvDispatch => {
  const chargedStateOfChargeKwh = Math.min(
    plan.evCapacityKwh,
    evStateOfChargeKwh + evChargeKwh * EV_ASSUMPTIONS.chargeEfficiency,
  )
  if (!canSupplyGrid || !isPeakHour) {
    return {
      remainingDemandKwh,
      evDischargeKwh: 0,
      evExportKwh: 0,
      evStateOfChargeKwh: chargedStateOfChargeKwh,
    }
  }

  const availableEvDischargeKwh = Math.min(
    EV_ASSUMPTIONS.maxDischargeKw,
    Math.max(0, chargedStateOfChargeKwh - plan.evReserveKwh) * EV_ASSUMPTIONS.dischargeEfficiency,
  )
  const dischargeToHomeKwh = plan.evHomeDischargeProfitable
    ? Math.min(remainingDemandKwh, availableEvDischargeKwh)
    : 0
  const evExportKwh = plan.evExportProfitable ? availableEvDischargeKwh - dischargeToHomeKwh : 0
  const evDischargeKwh = dischargeToHomeKwh + evExportKwh

  return {
    remainingDemandKwh: remainingDemandKwh - dischargeToHomeKwh,
    evDischargeKwh,
    evExportKwh,
    evStateOfChargeKwh:
      chargedStateOfChargeKwh - evDischargeKwh / EV_ASSUMPTIONS.dischargeEfficiency,
  }
}
