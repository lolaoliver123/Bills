import type { EnergyAssets, HouseholdProfile } from './schema'

export type ScenarioId = 'current' | 'solar' | 'battery' | 'solar-battery'

export type HouseholdScenario = {
  id: ScenarioId
  label: string
  description: string
  household: HouseholdProfile
  assets: EnergyAssets
}



