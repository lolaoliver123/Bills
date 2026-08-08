import {
  getBatteryCapacityKwh,
  getSolarCapacityKw,
} from 'features/household-energy-comparison/models/schema'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import {
  BATTERY_ASSUMPTIONS,
  EV_CHARGING_WH,
  GENERAL_ELECTRICITY_WH,
  HEAT_PUMP_ELECTRICITY_WH,
  REFERENCE_EV_CAPACITY_KWH,
  REFERENCE_EV_CHARGES_PER_WEEK,
  REFERENCE_HEAT_PUMP_KW,
  REFERENCE_SOLAR_GENERATION_WH,
  REFERENCE_SOLAR_KW,
} from './config'
import type {
  HourlyEnergyFlow,
  SimulationOptions,
} from 'features/household-energy-comparison/models/simulation'

const whToKwh = (value: number): number => value / 1000
const isCheapHour = (hour: number): boolean =>
  hour >= BATTERY_ASSUMPTIONS.cheapStartHour && hour < BATTERY_ASSUMPTIONS.cheapEndHour
const isPeakHour = (hour: number): boolean =>
  hour >= BATTERY_ASSUMPTIONS.peakStartHour && hour < BATTERY_ASSUMPTIONS.peakEndHour

export const simulateDailyEnergy = (
  { household, assets }: HouseholdScenario,
  { demandScale = 1 }: SimulationOptions = {},
): HourlyEnergyFlow[] => {
  const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0
  const heatPumpRatio = household.heatPump.capacityKw / REFERENCE_HEAT_PUMP_KW
  const evRatio = household.electricVehicle
    ? (household.electricVehicle.batteryCapacityKwh * household.electricVehicle.chargesPerWeek) /
      (REFERENCE_EV_CAPACITY_KWH * REFERENCE_EV_CHARGES_PER_WEEK)
    : 0

  const batteryCapacityKwh = assets.battery ? getBatteryCapacityKwh(assets.battery) : 0
  const reserveKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction
  const cheapChargeTargetKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.cheapChargeTargetFraction
  const maxChargeKwh = (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxChargeKwPerUnit
  const maxDischargeKwh =
    (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit
  let stateOfChargeKwh = reserveKwh

  return GENERAL_ELECTRICITY_WH.map((generalElectricityWh, hour) => {
    const heatPumpDemandKwh = whToKwh(HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpRatio) * demandScale
    const electricityDemandKwh =
      whToKwh(
        generalElectricityWh +
          HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpRatio +
          EV_CHARGING_WH[hour] * evRatio,
      ) * demandScale
    const solarGenerationKwh = whToKwh(REFERENCE_SOLAR_GENERATION_WH[hour] * solarRatio)
    const directSolarKwh = Math.min(electricityDemandKwh, solarGenerationKwh)
    let remainingDemandKwh = electricityDemandKwh - directSolarKwh
    let surplusSolarKwh = solarGenerationKwh - directSolarKwh
    let batteryChargeKwh = 0
    let batteryDischargeKwh = 0
    let gridImportKwh: number
    let gridExportKwh: number

    if (!assets.battery) {
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh
    } else if (isPeakHour(hour)) {
      const availableDischargeKwh = Math.min(
        maxDischargeKwh,
        Math.max(0, stateOfChargeKwh - reserveKwh) * BATTERY_ASSUMPTIONS.dischargeEfficiency,
      )
      const dischargeToHomeKwh = Math.min(remainingDemandKwh, availableDischargeKwh)
      const dischargeToGridKwh = Math.min(
        maxDischargeKwh - dischargeToHomeKwh,
        availableDischargeKwh - dischargeToHomeKwh,
      )

      batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh
      stateOfChargeKwh -= batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency
      remainingDemandKwh -= dischargeToHomeKwh
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh + dischargeToGridKwh
    } else {
      const solarChargeKwh = Math.min(
        surplusSolarKwh,
        maxChargeKwh,
        Math.max(0, batteryCapacityKwh - stateOfChargeKwh) / BATTERY_ASSUMPTIONS.chargeEfficiency,
      )
      batteryChargeKwh += solarChargeKwh
      stateOfChargeKwh += solarChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
      surplusSolarKwh -= solarChargeKwh

      let gridChargeKwh = 0
      if (isCheapHour(hour)) {
        gridChargeKwh = Math.min(
          maxChargeKwh - batteryChargeKwh,
          Math.max(0, cheapChargeTargetKwh - stateOfChargeKwh) /
            BATTERY_ASSUMPTIONS.chargeEfficiency,
        )
        batteryChargeKwh += gridChargeKwh
        stateOfChargeKwh += gridChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
      }

      gridImportKwh = remainingDemandKwh + gridChargeKwh
      gridExportKwh = surplusSolarKwh
    }

    stateOfChargeKwh = Math.min(batteryCapacityKwh, Math.max(reserveKwh, stateOfChargeKwh))

    return {
      hour,
      electricityDemandKwh,
      heatPumpDemandKwh,
      solarGenerationKwh,
      batteryChargeKwh,
      batteryDischargeKwh,
      gridImportKwh,
      gridExportKwh,
      batteryStateOfChargeKwh: stateOfChargeKwh,
    }
  })
}
