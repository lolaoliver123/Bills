import {
  getBatteryCapacityKwh,
  getSolarCapacityKw,
} from 'features/household-energy-comparison/models/schema'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import {
  BATTERY_ASSUMPTIONS,
  EV_ASSUMPTIONS,
  EV_CHARGING_WH,
  EV_RESERVE_FRACTION,
  GENERAL_ELECTRICITY_WH,
  HEAT_PUMP_ELECTRICITY_WH,
  REFERENCE_SOLAR_GENERATION_WH,
  REFERENCE_SOLAR_KW,
  REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR,
} from './config'
import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'
import type {
  HourlyEnergyFlow,
  SimulationOptions,
} from 'features/household-energy-comparison/models/simulation'

const whToKwh = (value: number): number => value / 1000
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0)

export const simulateDailyEnergy = (
  { household, assets }: HouseholdScenario,
  { demandScale = 1, tariff = DEFAULT_ELECTRICITY_TARIFF }: SimulationOptions = {},
): HourlyEnergyFlow[] => {
  const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0
  const annualHeatPumpDemandKwh =
    (household.heatPump.annualSpaceHeatingDemandKwh +
      (household.heatPump.suppliesHotWater ? household.heatPump.annualHotWaterDemandKwh : 0)) /
    household.heatPump.scop
  const dailyHeatPumpDemandKwh = annualHeatPumpDemandKwh / 365
  const heatPumpProfileScale = dailyHeatPumpDemandKwh / whToKwh(sum(HEAT_PUMP_ELECTRICITY_WH))
  const dailyEvGridChargeKwh = household.electricVehicle
    ? (household.electricVehicle.batteryCapacityKwh *
        household.electricVehicle.chargesPerWeek *
        52) /
      365 /
      EV_ASSUMPTIONS.chargeEfficiency
    : 0
  const evProfileScale = dailyEvGridChargeKwh / whToKwh(sum(EV_CHARGING_WH))
  const evCapacityKwh = household.electricVehicle?.batteryCapacityKwh ?? 0
  const evReserveKwh = evCapacityKwh * EV_RESERVE_FRACTION
  let evStateOfChargeKwh = evReserveKwh

  const heatPumpDemandAt = (hour: number): number =>
    whToKwh(HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpProfileScale)
  const evChargeAt = (hour: number): number => whToKwh(EV_CHARGING_WH[hour] * evProfileScale)
  const electricityDemandAt = (hour: number): number =>
    whToKwh(GENERAL_ELECTRICITY_WH[hour]) * demandScale + heatPumpDemandAt(hour) + evChargeAt(hour)
  const referenceSolarDailyKwh = (REFERENCE_SOLAR_KW * REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR) / 365
  const solarProfileScale = referenceSolarDailyKwh / whToKwh(sum(REFERENCE_SOLAR_GENERATION_WH))
  const solarGenerationAt = (hour: number): number =>
    whToKwh(REFERENCE_SOLAR_GENERATION_WH[hour] * solarProfileScale * solarRatio)

  const batteryCapacityKwh = assets.battery ? getBatteryCapacityKwh(assets.battery) : 0
  const reserveKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction
  const maxChargeKwh = (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxChargeKwPerUnit
  const maxDischargeKwh =
    (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit
  const isCheapHour = (hour: number): boolean =>
    hour >= tariff.nightStartHour && hour < tariff.nightEndHour
  const isPeakHour = (hour: number): boolean =>
    hour >= tariff.peakExportStartHour && hour < tariff.peakExportEndHour
  const peakHours = tariff.peakExportEndHour - tariff.peakExportStartHour
  const batteryRoundTripEfficiency =
    BATTERY_ASSUMPTIONS.chargeEfficiency * BATTERY_ASSUMPTIONS.dischargeEfficiency
  const evRoundTripEfficiency = EV_ASSUMPTIONS.chargeEfficiency * EV_ASSUMPTIONS.dischargeEfficiency
  const batteryHomeDischargeProfitable =
    tariff.dayImportGbpPerKwh * batteryRoundTripEfficiency > tariff.nightImportGbpPerKwh
  const batteryExportProfitable =
    tariff.peakExportGbpPerKwh * batteryRoundTripEfficiency > tariff.nightImportGbpPerKwh
  const evHomeDischargeProfitable =
    tariff.dayImportGbpPerKwh * evRoundTripEfficiency > tariff.nightImportGbpPerKwh
  const evExportProfitable =
    tariff.peakExportGbpPerKwh * evRoundTripEfficiency > tariff.nightImportGbpPerKwh
  const solarStorageValue =
    Math.max(tariff.dayImportGbpPerKwh, tariff.peakExportGbpPerKwh) * batteryRoundTripEfficiency
  const shouldStoreSolar = solarStorageValue > tariff.exportGbpPerKwh

  let forecastEvStateOfChargeKwh = evReserveKwh
  for (let hour = 0; hour < tariff.peakExportStartHour; hour += 1) {
    forecastEvStateOfChargeKwh = Math.min(
      evCapacityKwh,
      forecastEvStateOfChargeKwh + evChargeAt(hour) * EV_ASSUMPTIONS.chargeEfficiency,
    )
  }
  let forecastPeakDemandKwh = 0
  for (let hour = tariff.peakExportStartHour; hour < tariff.peakExportEndHour; hour += 1) {
    let residualDemandKwh = Math.max(0, electricityDemandAt(hour) - solarGenerationAt(hour))
    if (household.electricVehicle?.canSupplyGrid && evHomeDischargeProfitable) {
      const evOutputKwh = Math.min(
        residualDemandKwh,
        EV_ASSUMPTIONS.maxDischargeKw,
        Math.max(0, forecastEvStateOfChargeKwh - evReserveKwh) * EV_ASSUMPTIONS.dischargeEfficiency,
      )
      forecastEvStateOfChargeKwh -= evOutputKwh / EV_ASSUMPTIONS.dischargeEfficiency
      residualDemandKwh -= evOutputKwh
    }
    forecastPeakDemandKwh += residualDemandKwh
  }

  const peakDispatchableStoredKwh = Math.min(
    Math.max(0, batteryCapacityKwh - reserveKwh),
    (maxDischargeKwh * peakHours) / BATTERY_ASSUMPTIONS.dischargeEfficiency,
  )
  const desiredPeakStoredKwh = batteryExportProfitable
    ? reserveKwh + peakDispatchableStoredKwh
    : batteryHomeDischargeProfitable
      ? reserveKwh +
        Math.min(
          peakDispatchableStoredKwh,
          forecastPeakDemandKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency,
        )
      : reserveKwh
  const forecastSolarStoredKwh = shouldStoreSolar
    ? GENERAL_ELECTRICITY_WH.reduce((total, _, hour) => {
        if (hour < tariff.nightEndHour || hour >= tariff.peakExportStartHour) return total
        const surplusKwh = Math.max(0, solarGenerationAt(hour) - electricityDemandAt(hour))
        return total + Math.min(surplusKwh, maxChargeKwh) * BATTERY_ASSUMPTIONS.chargeEfficiency
      }, 0)
    : 0
  const cheapChargeTargetKwh = Math.max(
    reserveKwh,
    desiredPeakStoredKwh - Math.min(forecastSolarStoredKwh, desiredPeakStoredKwh - reserveKwh),
  )
  let stateOfChargeKwh = reserveKwh

  return GENERAL_ELECTRICITY_WH.map((_, hour) => {
    const heatPumpDemandKwh = heatPumpDemandAt(hour)
    const evChargeKwh = evChargeAt(hour)
    const electricityDemandKwh = electricityDemandAt(hour)
    const solarGenerationKwh = solarGenerationAt(hour)
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
      evCapacityKwh,
      evStateOfChargeKwh + evChargeKwh * EV_ASSUMPTIONS.chargeEfficiency,
    )
    if (household.electricVehicle?.canSupplyGrid && isPeakHour(hour)) {
      const availableEvDischargeKwh = Math.min(
        EV_ASSUMPTIONS.maxDischargeKw,
        Math.max(0, evStateOfChargeKwh - evReserveKwh) * EV_ASSUMPTIONS.dischargeEfficiency,
      )
      const dischargeToHomeKwh = evHomeDischargeProfitable
        ? Math.min(remainingDemandKwh, availableEvDischargeKwh)
        : 0
      evExportKwh = evExportProfitable ? availableEvDischargeKwh - dischargeToHomeKwh : 0
      evDischargeKwh = dischargeToHomeKwh + evExportKwh
      evStateOfChargeKwh -= evDischargeKwh / EV_ASSUMPTIONS.dischargeEfficiency
      remainingDemandKwh -= dischargeToHomeKwh
    }

    if (!assets.battery) {
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh + evExportKwh
    } else if (isPeakHour(hour)) {
      const availableDischargeKwh = Math.min(
        maxDischargeKwh,
        Math.max(0, stateOfChargeKwh - reserveKwh) * BATTERY_ASSUMPTIONS.dischargeEfficiency,
      )
      const dischargeToHomeKwh = batteryHomeDischargeProfitable
        ? Math.min(remainingDemandKwh, availableDischargeKwh)
        : 0
      const dischargeToGridKwh = batteryExportProfitable
        ? availableDischargeKwh - dischargeToHomeKwh
        : 0

      batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh
      stateOfChargeKwh -= batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency
      remainingDemandKwh -= dischargeToHomeKwh
      gridImportKwh = remainingDemandKwh
      gridExportKwh = surplusSolarKwh + evExportKwh + dischargeToGridKwh
    } else {
      const solarChargeKwh = shouldStoreSolar
        ? Math.min(
            surplusSolarKwh,
            maxChargeKwh,
            Math.max(0, batteryCapacityKwh - stateOfChargeKwh) /
              BATTERY_ASSUMPTIONS.chargeEfficiency,
          )
        : 0
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
      gridExportKwh = surplusSolarKwh + evExportKwh
    }

    stateOfChargeKwh = Math.min(batteryCapacityKwh, Math.max(reserveKwh, stateOfChargeKwh))

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
      batteryStateOfChargeKwh: stateOfChargeKwh,
    }
  })
}
