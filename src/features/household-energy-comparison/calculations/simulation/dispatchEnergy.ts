import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import type { EnergyProfiles } from './buildEnergyProfiles'
import type { StoragePlan } from './buildStoragePlan'
import { BATTERY_ASSUMPTIONS, EV_ASSUMPTIONS } from './config'

const isWithinWindow = (hour: number, startHour: number, endHour: number): boolean =>
  hour >= startHour && hour < endHour

export const dispatchEnergy = (
  { household, assets }: HouseholdScenario,
  tariff: ElectricityTariff,
  profiles: EnergyProfiles,
  plan: StoragePlan,
): HourlyEnergyFlow[] => {
  let evStateOfChargeKwh = plan.evReserveKwh
  let batteryStateOfChargeKwh = plan.batteryReserveKwh

  return profiles.electricityDemandKwh.map((electricityDemandKwh, hour) => {
    const heatPumpDemandKwh = profiles.heatPumpDemandKwh[hour]
    const evChargeKwh = profiles.evChargeKwh[hour]
    const solarGenerationKwh = profiles.solarGenerationKwh[hour]
    const directSolarKwh = Math.min(electricityDemandKwh, solarGenerationKwh)
    let remainingDemandKwh = electricityDemandKwh - directSolarKwh
    let surplusSolarKwh = solarGenerationKwh - directSolarKwh
    let evDischargeKwh = 0
    let evExportKwh = 0
    let batteryChargeKwh = 0
    let batteryDischargeKwh = 0
    let gridImportKwh: number
    let gridExportKwh: number

    evStateOfChargeKwh = Math.min(
      plan.evCapacityKwh,
      evStateOfChargeKwh + evChargeKwh * EV_ASSUMPTIONS.chargeEfficiency,
    )
    const isPeakHour = isWithinWindow(hour, tariff.peakExportStartHour, tariff.peakExportEndHour)
    if (household.electricVehicle?.canSupplyGrid && isPeakHour) {
      const availableEvDischargeKwh = Math.min(
        EV_ASSUMPTIONS.maxDischargeKw,
        Math.max(0, evStateOfChargeKwh - plan.evReserveKwh) * EV_ASSUMPTIONS.dischargeEfficiency,
      )
      const dischargeToHomeKwh = plan.evHomeDischargeProfitable
        ? Math.min(remainingDemandKwh, availableEvDischargeKwh)
        : 0
      evExportKwh = plan.evExportProfitable ? availableEvDischargeKwh - dischargeToHomeKwh : 0
      evDischargeKwh = dischargeToHomeKwh + evExportKwh
      evStateOfChargeKwh -= evDischargeKwh / EV_ASSUMPTIONS.dischargeEfficiency
      remainingDemandKwh -= dischargeToHomeKwh
    }

    if (!assets.battery) {
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh + evExportKwh
    } else if (isPeakHour) {
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

      batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh
      batteryStateOfChargeKwh -= batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency
      remainingDemandKwh -= dischargeToHomeKwh
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh + evExportKwh + dischargeToGridKwh
    } else {
      const solarChargeKwh = plan.shouldStoreSolar
        ? Math.min(
            surplusSolarKwh,
            plan.maxBatteryChargeKwh,
            Math.max(0, plan.batteryCapacityKwh - batteryStateOfChargeKwh) /
              BATTERY_ASSUMPTIONS.chargeEfficiency,
          )
        : 0
      batteryChargeKwh += solarChargeKwh
      batteryStateOfChargeKwh += solarChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
      surplusSolarKwh -= solarChargeKwh

      let gridChargeKwh = 0
      const isCheapHour = isWithinWindow(hour, tariff.nightStartHour, tariff.nightEndHour)
      if (isCheapHour) {
        gridChargeKwh = Math.min(
          plan.maxBatteryChargeKwh - batteryChargeKwh,
          Math.max(0, plan.cheapChargeTargetKwh - batteryStateOfChargeKwh) /
            BATTERY_ASSUMPTIONS.chargeEfficiency,
        )
        batteryChargeKwh += gridChargeKwh
        batteryStateOfChargeKwh += gridChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
      }

      gridImportKwh = remainingDemandKwh + gridChargeKwh
      gridExportKwh = surplusSolarKwh + evExportKwh
    }

    batteryStateOfChargeKwh = Math.min(
      plan.batteryCapacityKwh,
      Math.max(plan.batteryReserveKwh, batteryStateOfChargeKwh),
    )

    return {
      hour,
      electricityDemandKwh,
      heatPumpDemandKwh,
      evChargeKwh,
      evDischargeKwh,
      solarGenerationKwh,
      batteryChargeKwh,
      batteryDischargeKwh,
      gridImportKwh,
      gridExportKwh,
      batteryStateOfChargeKwh,
    }
  })
}
