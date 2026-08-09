import type { ElectricityTariff } from 'features/household-energy-comparison/models/billing'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import type { EnergyProfiles } from './buildEnergyProfiles'
import type { StoragePlan } from './buildStoragePlan'
import { BATTERY_ASSUMPTIONS, EV_ASSUMPTIONS } from './config'

type EvDispatch = {
  remainingDemandKwh: number
  evDischargeKwh: number
  evExportKwh: number
  evStateOfChargeKwh: number
}

type BatteryDispatch = {
  batteryChargeKwh: number
  batteryDischargeKwh: number
  gridImportKwh: number
  gridExportKwh: number
  batteryStateOfChargeKwh: number
}

type DispatchState = {
  flows: HourlyEnergyFlow[]
  evStateOfChargeKwh: number
  batteryStateOfChargeKwh: number
}

const isWithinWindow = (hour: number, startHour: number, endHour: number): boolean =>
  hour >= startHour && hour < endHour

const dispatchEv = (
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

const dispatchPeakBattery = (
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan,
): BatteryDispatch => {
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
  const batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh

  return {
    batteryChargeKwh: 0,
    batteryDischargeKwh,
    gridImportKwh: remainingDemandKwh - dischargeToHomeKwh,
    gridExportKwh: surplusSolarKwh + evExportKwh + dischargeToGridKwh,
    batteryStateOfChargeKwh:
      batteryStateOfChargeKwh - batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency,
  }
}

const dispatchOffPeakBattery = (
  isCheapHour: boolean,
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan,
): BatteryDispatch => {
  const solarChargeKwh = plan.shouldStoreSolar
    ? Math.min(
        surplusSolarKwh,
        plan.maxBatteryChargeKwh,
        Math.max(0, plan.batteryCapacityKwh - batteryStateOfChargeKwh) /
          BATTERY_ASSUMPTIONS.chargeEfficiency,
      )
    : 0
  const stateOfChargeAfterSolarKwh =
    batteryStateOfChargeKwh + solarChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency
  const gridChargeKwh = isCheapHour
    ? Math.min(
        plan.maxBatteryChargeKwh - solarChargeKwh,
        Math.max(0, plan.cheapChargeTargetKwh - stateOfChargeAfterSolarKwh) /
          BATTERY_ASSUMPTIONS.chargeEfficiency,
      )
    : 0

  return {
    batteryChargeKwh: solarChargeKwh + gridChargeKwh,
    batteryDischargeKwh: 0,
    gridImportKwh: remainingDemandKwh + gridChargeKwh,
    gridExportKwh: surplusSolarKwh - solarChargeKwh + evExportKwh,
    batteryStateOfChargeKwh:
      stateOfChargeAfterSolarKwh + gridChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency,
  }
}

const dispatchBattery = (
  hasBattery: boolean,
  isPeakHour: boolean,
  isCheapHour: boolean,
  remainingDemandKwh: number,
  surplusSolarKwh: number,
  evExportKwh: number,
  batteryStateOfChargeKwh: number,
  plan: StoragePlan,
): BatteryDispatch => {
  if (!hasBattery) {
    return {
      batteryChargeKwh: 0,
      batteryDischargeKwh: 0,
      gridImportKwh: remainingDemandKwh,
      gridExportKwh: surplusSolarKwh + evExportKwh,
      batteryStateOfChargeKwh,
    }
  }
  if (isPeakHour) {
    return dispatchPeakBattery(
      remainingDemandKwh,
      surplusSolarKwh,
      evExportKwh,
      batteryStateOfChargeKwh,
      plan,
    )
  }
  return dispatchOffPeakBattery(
    isCheapHour,
    remainingDemandKwh,
    surplusSolarKwh,
    evExportKwh,
    batteryStateOfChargeKwh,
    plan,
  )
}

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
      const batteryDispatch = dispatchBattery(
        Boolean(assets.battery),
        isPeakHour,
        isWithinWindow(hour, tariff.nightStartHour, tariff.nightEndHour),
        evDispatch.remainingDemandKwh,
        surplusSolarKwh,
        evDispatch.evExportKwh,
        state.batteryStateOfChargeKwh,
        plan,
      )
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
