import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type {
  HourlyEnergyFlow,
  EnergyProfiles,
} from 'features/household-energy-comparison/models/simulation'
import type { StoragePlan } from 'features/household-energy-comparison/models/storage'
import { dispatchEv } from './dispatchEv'
import { dispatchBattery } from './dispatchBattery'
import { isHourInWindow } from 'features/household-energy-comparison/calculations/tariff'

export const dispatchEnergy = (
  { household, assets }: HouseholdScenario,
  tariff: ElectricityTariff,
  profiles: EnergyProfiles,
  plan: StoragePlan,
): HourlyEnergyFlow[] => {
  const flows: HourlyEnergyFlow[] = []
  const evStatesOfChargeKwh = [plan.evReserveKwh]
  const initialBatteryStateOfChargeKwh = plan.batteryReserveKwh

  profiles.electricityDemandKwh.forEach((electricityDemandKwh, hour) => {
    const previousFlow = flows.at(-1)
    const evStateOfChargeKwh = evStatesOfChargeKwh[hour]
    const previousBatteryStateOfChargeKwh =
      previousFlow?.batteryStateOfChargeKwh ?? initialBatteryStateOfChargeKwh
    const heatPumpDemandKwh = profiles.heatPumpDemandKwh[hour]
    const evChargeKwh = profiles.evChargeKwh[hour]
    const solarGenerationKwh = profiles.solarGenerationKwh[hour]
    const directSolarKwh = Math.min(electricityDemandKwh, solarGenerationKwh)
    const remainingDemandKwh = electricityDemandKwh - directSolarKwh
    const surplusSolarKwh = solarGenerationKwh - directSolarKwh
    const isPeakHour = isHourInWindow(hour, tariff.peakExportStartHour, tariff.peakExportEndHour)
    const evDispatch = dispatchEv(
      household.electricVehicle?.canSupplyGrid ?? false,
      isPeakHour,
      evChargeKwh,
      remainingDemandKwh,
      evStateOfChargeKwh,
      plan,
    )
    const batteryDispatch = dispatchBattery({
      hasBattery: Boolean(assets.battery),
      isPeakHour,
      isCheapHour: isHourInWindow(hour, tariff.nightStartHour, tariff.nightEndHour),
      remainingDemandKwh: evDispatch.remainingDemandKwh,
      surplusSolarKwh,
      evExportKwh: evDispatch.evExportKwh,
      batteryStateOfChargeKwh: previousBatteryStateOfChargeKwh,
      plan,
    })
    const batteryStateOfChargeKwh = Math.min(
      plan.batteryCapacityKwh,
      Math.max(plan.batteryReserveKwh, batteryDispatch.batteryStateOfChargeKwh),
    )
    const flow: HourlyEnergyFlow = {
      hour,
      electricityDemandKwh,
      heatPumpDemandKwh,
      evChargeKwh,
      evDischargeKwh: evDispatch.evDischargeKwh,
      solarGenerationKwh,
      batteryChargeKwh: batteryDispatch.batteryChargeKwh,
      batteryDischargeKwh: batteryDispatch.batteryDischargeKwh,
      gridImportKwh: batteryDispatch.gridImportKwh,
      gridExportKwh: batteryDispatch.gridExportKwh,
      batteryStateOfChargeKwh,
    }

    flows.push(flow)
    evStatesOfChargeKwh.push(evDispatch.evStateOfChargeKwh)
  })

  return flows
}
