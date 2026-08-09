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
  REFERENCE_EV_CAPACITY_KWH,
  REFERENCE_EV_CHARGES_PER_WEEK,
  REFERENCE_HEAT_PUMP_KW,
  REFERENCE_SOLAR_GENERATION_WH,
  REFERENCE_SOLAR_KW,
} from './config'
import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'
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
  { demandScale = 1, tariff = DEFAULT_ELECTRICITY_TARIFF }: SimulationOptions = {},
): HourlyEnergyFlow[] => {
  const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0
  const heatPumpRatio = household.heatPump.capacityKw / REFERENCE_HEAT_PUMP_KW
  const evRatio = household.electricVehicle
    ? (household.electricVehicle.batteryCapacityKwh * household.electricVehicle.chargesPerWeek) /
      (REFERENCE_EV_CAPACITY_KWH * REFERENCE_EV_CHARGES_PER_WEEK)
    : 0
  const evCapacityKwh = household.electricVehicle?.batteryCapacityKwh ?? 0
  const evReserveKwh = evCapacityKwh * EV_RESERVE_FRACTION
  let evStateOfChargeKwh = evReserveKwh

  const electricityDemandAt = (hour: number): number =>
    whToKwh(
      GENERAL_ELECTRICITY_WH[hour] +
        HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpRatio +
        EV_CHARGING_WH[hour] * evRatio,
    ) * demandScale
  const evChargeAt = (hour: number): number => whToKwh(EV_CHARGING_WH[hour] * evRatio) * demandScale
  const solarGenerationAt = (hour: number): number =>
    whToKwh(REFERENCE_SOLAR_GENERATION_WH[hour] * solarRatio)

  const batteryCapacityKwh = assets.battery ? getBatteryCapacityKwh(assets.battery) : 0
  const reserveKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction
  const maxChargeKwh = (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxChargeKwPerUnit
  const maxDischargeKwh =
    (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit
  const peakHours = BATTERY_ASSUMPTIONS.peakEndHour - BATTERY_ASSUMPTIONS.peakStartHour
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
  for (let hour = 0; hour < BATTERY_ASSUMPTIONS.peakStartHour; hour += 1) {
    forecastEvStateOfChargeKwh = Math.min(
      evCapacityKwh,
      forecastEvStateOfChargeKwh + evChargeAt(hour) * EV_ASSUMPTIONS.chargeEfficiency,
    )
  }
  let forecastPeakDemandKwh = 0
  for (
    let hour = BATTERY_ASSUMPTIONS.peakStartHour;
    hour < BATTERY_ASSUMPTIONS.peakEndHour;
    hour += 1
  ) {
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
        if (hour < BATTERY_ASSUMPTIONS.cheapEndHour || hour >= BATTERY_ASSUMPTIONS.peakStartHour)
          return total
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
    const heatPumpDemandKwh = whToKwh(HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpRatio) * demandScale
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
