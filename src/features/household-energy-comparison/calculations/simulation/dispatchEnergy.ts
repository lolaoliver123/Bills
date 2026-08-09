import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import type { EnergyProfiles } from './buildEnergyProfiles'
import type { StoragePlan } from './buildStoragePlan'
import type { DispatchState } from 'features/household-energy-comparison/models/dispatches'
import { dispatchEv } from './dispatchEv'
import { dispatchBattery } from './dispatchBattery'

const isWithinWindow = (hour: number, startHour: number, endHour: number): boolean =>
  hour >= startHour && hour < endHour

export const dispatchEnergy = (
  { household, assets }: HouseholdScenario,
  tariff: ElectricityTariff,
  profiles: EnergyProfiles,
  plan: StoragePlan,
): HourlyEnergyFlow[] =>
  profiles.electricityDemandKwh.reduce<DispatchState>(
    (state, electricityDemandKwh, hour) => {
      const heatPumpDemandKwh = profiles.heatPumpDemandKwh[hour]
      const evChargeKwh = profiles.evChargeKwh[hour]
      const solarGenerationKwh = profiles.solarGenerationKwh[hour]
      const directSolarKwh = Math.min(electricityDemandKwh, solarGenerationKwh)
      const remainingDemandKwh = electricityDemandKwh - directSolarKwh
      const surplusSolarKwh = solarGenerationKwh - directSolarKwh
      const isPeakHour = isWithinWindow(hour, tariff.peakExportStartHour, tariff.peakExportEndHour)
      const evDispatch = dispatchEv(
        household.electricVehicle?.canSupplyGrid ?? false,
        isPeakHour,
        evChargeKwh,
        remainingDemandKwh,
        state.evStateOfChargeKwh,
        plan,
      )
      const batteryDispatch = dispatchBattery({
        hasBattery: Boolean(assets.battery),
        isPeakHour,
        isCheapHour: isWithinWindow(hour, tariff.nightStartHour, tariff.nightEndHour),
        remainingDemandKwh: evDispatch.remainingDemandKwh,
        surplusSolarKwh,
        evExportKwh: evDispatch.evExportKwh,
        batteryStateOfChargeKwh: state.batteryStateOfChargeKwh,
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

      return {
        flows: [...state.flows, flow],
        evStateOfChargeKwh: evDispatch.evStateOfChargeKwh,
        batteryStateOfChargeKwh,
      }
    },
    {
      flows: [],
      evStateOfChargeKwh: plan.evReserveKwh,
      batteryStateOfChargeKwh: plan.batteryReserveKwh,
    },
  ).flows
