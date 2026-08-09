import {
  PROPOSED_SOLAR_PANEL_CAPACITY_KW,
  type BatterySystem,
  type EnergyAssets,
  type SolarSystem,
} from './assets'
import { householdFormSchema, type HouseholdFormDraft } from './formSchema'

export type HeatPump = {
  capacityKw: number
  annualSpaceHeatingDemandKwh: number
  suppliesHotWater: boolean
  annualHotWaterDemandKwh: number
  scop: number
}

export type ElectricVehicle = {
  batteryCapacityKwh: number
  chargesPerWeek: number
  canSupplyGrid: boolean
}

export type HouseholdProfile = {
  heatPump: HeatPump
  electricVehicle?: ElectricVehicle
  monthlyElectricityCost: number
}

export type HouseholdAssessment = {
  household: HouseholdProfile
  current: EnergyAssets
  proposed: EnergyAssets
}

export const toHouseholdAssessment = (draft: HouseholdFormDraft): HouseholdAssessment => {
  const parsed = householdFormSchema.parse(draft)
  const solar: SolarSystem = {
    panelCount: parsed.solar.panelCount!,
    panelCapacityKw: parsed.hasSolar
      ? parsed.solar.panelCapacityKw!
      : PROPOSED_SOLAR_PANEL_CAPACITY_KW,
  }
  const battery: BatterySystem = {
    unitCount: parsed.battery.unitCount!,
    unitCapacityKwh: parsed.battery.unitCapacityKwh!,
  }

  return {
    household: {
      heatPump: {
        capacityKw: parsed.heatPump.capacityKw!,
        annualSpaceHeatingDemandKwh: parsed.heatPump.annualSpaceHeatingDemandKwh!,
        suppliesHotWater: parsed.heatPump.suppliesHotWater!,
        annualHotWaterDemandKwh: parsed.heatPump.suppliesHotWater
          ? parsed.heatPump.annualHotWaterDemandKwh!
          : 0,
        scop: parsed.heatPump.scop!,
      },
      monthlyElectricityCost: parsed.monthlyElectricityCost!,
      electricVehicle: parsed.hasElectricVehicle
        ? {
            batteryCapacityKwh: parsed.electricVehicle.batteryCapacityKwh!,
            chargesPerWeek: parsed.electricVehicle.chargesPerWeek!,
            canSupplyGrid: parsed.electricVehicle.canSupplyGrid!,
          }
        : undefined,
    },
    current: {
      solar: parsed.hasSolar ? solar : undefined,
      battery: parsed.hasBatteries ? battery : undefined,
    },
    proposed: {
      solar: parsed.hasSolar === false ? solar : undefined,
      battery: parsed.hasBatteries === false ? battery : undefined,
    },
  }
}
