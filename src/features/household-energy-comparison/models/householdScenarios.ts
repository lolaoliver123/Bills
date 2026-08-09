import type { HouseholdProfile } from './assessment'
import type { EnergyAssets } from './assets'

export type ScenarioId = 'current' | 'solar' | 'battery' | 'solar-battery'

export type HouseholdScenario = {
  id: ScenarioId
  label: string
  description: string
  household: HouseholdProfile
  assets: EnergyAssets
}
