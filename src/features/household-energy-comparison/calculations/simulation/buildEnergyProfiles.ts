import { getSolarCapacityKw } from 'features/household-energy-comparison/models/schema'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import {
  DAYS_PER_YEAR,
  WEEKS_PER_YEAR,
  WH_PER_KWH,
} from 'features/household-energy-comparison/calculations/config'
import {
  EV_ASSUMPTIONS,
  EV_CHARGING_WH,
  GENERAL_ELECTRICITY_WH,
  HEAT_PUMP_ELECTRICITY_WH,
  REFERENCE_SOLAR_GENERATION_WH,
  REFERENCE_SOLAR_KW,
  REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR,
} from './config'

const whToKwh = (value: number): number => value / WH_PER_KWH
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

export const buildEnergyProfiles = (
  { household, assets }: HouseholdScenario,
  demandScale: number,
): EnergyProfiles => {
  const annualHeatPumpDemandKwh =
    (household.heatPump.annualSpaceHeatingDemandKwh +
      (household.heatPump.suppliesHotWater ? household.heatPump.annualHotWaterDemandKwh : 0)) /
    household.heatPump.scop
  const heatPumpProfileScale =
    annualHeatPumpDemandKwh / DAYS_PER_YEAR / whToKwh(sum(HEAT_PUMP_ELECTRICITY_WH))
  const heatPumpDemandKwh = HEAT_PUMP_ELECTRICITY_WH.map((demandWh) =>
    whToKwh(demandWh * heatPumpProfileScale),
  )

  const dailyEvGridChargeKwh = household.electricVehicle
    ? (household.electricVehicle.batteryCapacityKwh *
        household.electricVehicle.chargesPerWeek *
        WEEKS_PER_YEAR) /
      DAYS_PER_YEAR /
      EV_ASSUMPTIONS.chargeEfficiency
    : 0
  const evProfileScale = dailyEvGridChargeKwh / whToKwh(sum(EV_CHARGING_WH))
  const evChargeKwh = EV_CHARGING_WH.map((chargeWh) => whToKwh(chargeWh * evProfileScale))

  const electricityDemandKwh = GENERAL_ELECTRICITY_WH.map(
    (demandWh, hour) =>
      whToKwh(demandWh) * demandScale + heatPumpDemandKwh[hour] + evChargeKwh[hour],
  )

  const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0
  const referenceSolarDailyKwh =
    (REFERENCE_SOLAR_KW * REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR) / DAYS_PER_YEAR
  const solarProfileScale = referenceSolarDailyKwh / whToKwh(sum(REFERENCE_SOLAR_GENERATION_WH))
  const solarGenerationKwh = REFERENCE_SOLAR_GENERATION_WH.map((generationWh) =>
    whToKwh(generationWh * solarProfileScale * solarRatio),
  )

  return {
    heatPumpDemandKwh,
    evChargeKwh,
    electricityDemandKwh,
    solarGenerationKwh,
  }
}
