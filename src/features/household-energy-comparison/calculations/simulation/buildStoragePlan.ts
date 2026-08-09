import { getBatteryCapacityKwh } from 'features/household-energy-comparison/models/schema'
import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type { EnergyProfiles } from './buildEnergyProfiles'
import { BATTERY_ASSUMPTIONS, EV_ASSUMPTIONS, EV_RESERVE_FRACTION } from './config'
import type { StoragePlan } from 'features/household-energy-comparison/models/storage'
import { forecastPeakDemand } from './forecastPeakDemand'
import { calculateDesiredPeakStoredKwh } from './calculateDesiredPeakStoredKwh'

export const buildStoragePlan = (
  scenario: HouseholdScenario,
  tariff: ElectricityTariff,
  profiles: EnergyProfiles,
): StoragePlan => {
  const { household, assets } = scenario
  const batteryCapacityKwh = assets.battery ? getBatteryCapacityKwh(assets.battery) : 0
  const batteryReserveKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction
  const maxBatteryChargeKwh =
    (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxChargeKwPerUnit
  const maxBatteryDischargeKwh =
    (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit
  const evCapacityKwh = household.electricVehicle?.batteryCapacityKwh ?? 0
  const evReserveKwh = evCapacityKwh * EV_RESERVE_FRACTION

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
  const shouldStoreSolar =
    Math.max(tariff.dayImportGbpPerKwh, tariff.peakExportGbpPerKwh) * batteryRoundTripEfficiency >
    tariff.exportGbpPerKwh

  const peakHours = tariff.peakExportEndHour - tariff.peakExportStartHour
  const peakDispatchableStoredKwh = Math.min(
    Math.max(0, batteryCapacityKwh - batteryReserveKwh),
    (maxBatteryDischargeKwh * peakHours) / BATTERY_ASSUMPTIONS.dischargeEfficiency,
  )
  const forecastPeakDemandKwh = forecastPeakDemand(
    scenario,
    tariff,
    profiles,
    evCapacityKwh,
    evReserveKwh,
    evHomeDischargeProfitable,
  )
  const desiredPeakStoredKwh = calculateDesiredPeakStoredKwh({
    batteryReserveKwh,
    peakDispatchableStoredKwh,
    forecastPeakDemandKwh,
    batteryExportProfitable,
    batteryHomeDischargeProfitable,
  })
  const forecastSolarStoredKwh = shouldStoreSolar
    ? profiles.electricityDemandKwh.reduce((total, demandKwh, hour) => {
        if (hour < tariff.nightEndHour || hour >= tariff.peakExportStartHour) return total
        const surplusKwh = Math.max(0, profiles.solarGenerationKwh[hour] - demandKwh)
        return (
          total + Math.min(surplusKwh, maxBatteryChargeKwh) * BATTERY_ASSUMPTIONS.chargeEfficiency
        )
      }, 0)
    : 0
  const cheapChargeTargetKwh = Math.max(
    batteryReserveKwh,
    desiredPeakStoredKwh -
      Math.min(forecastSolarStoredKwh, desiredPeakStoredKwh - batteryReserveKwh),
  )

  return {
    batteryCapacityKwh,
    batteryReserveKwh,
    maxBatteryChargeKwh,
    maxBatteryDischargeKwh,
    cheapChargeTargetKwh,
    batteryHomeDischargeProfitable,
    batteryExportProfitable,
    shouldStoreSolar,
    evCapacityKwh,
    evReserveKwh,
    evHomeDischargeProfitable,
    evExportProfitable,
  }
}
