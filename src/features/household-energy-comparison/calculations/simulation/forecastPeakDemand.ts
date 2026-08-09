import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type { EnergyProfiles } from 'features/household-energy-comparison/models/simulation'
import { EV_ASSUMPTIONS } from './config'
import {
  getHoursInWindow,
  isHourInWindow,
} from 'features/household-energy-comparison/calculations/tariff'

export const forecastPeakDemand = (
  scenario: HouseholdScenario,
  tariff: ElectricityTariff,
  profiles: EnergyProfiles,
  evCapacityKwh: number,
  evReserveKwh: number,
  evHomeDischargeProfitable: boolean,
): number => {
  const prePeakEvStateOfChargeKwh = profiles.evChargeKwh.reduce(
    (stateOfChargeKwh, chargeKwh, hour) =>
      isHourInWindow(hour, 0, tariff.peakExportStartHour)
        ? Math.min(evCapacityKwh, stateOfChargeKwh + chargeKwh * EV_ASSUMPTIONS.chargeEfficiency)
        : stateOfChargeKwh,
    evReserveKwh,
  )
  const canEvSupplyPeakDemand =
    scenario.household.electricVehicle?.canSupplyGrid && evHomeDischargeProfitable

  return getHoursInWindow(tariff.peakExportStartHour, tariff.peakExportEndHour).reduce(
    (forecast, hour) => {
      const electricityDemandKwh = profiles.electricityDemandKwh[hour]
      const demandAfterSolarKwh = Math.max(
        0,
        electricityDemandKwh - profiles.solarGenerationKwh[hour],
      )
      const evOutputKwh = canEvSupplyPeakDemand
        ? Math.min(
            demandAfterSolarKwh,
            EV_ASSUMPTIONS.maxDischargeKw,
            Math.max(0, forecast.evStateOfChargeKwh - evReserveKwh) *
              EV_ASSUMPTIONS.dischargeEfficiency,
          )
        : 0

      return {
        evStateOfChargeKwh:
          forecast.evStateOfChargeKwh - evOutputKwh / EV_ASSUMPTIONS.dischargeEfficiency,
        peakDemandKwh: forecast.peakDemandKwh + demandAfterSolarKwh - evOutputKwh,
      }
    },
    { evStateOfChargeKwh: prePeakEvStateOfChargeKwh, peakDemandKwh: 0 },
  ).peakDemandKwh
}
