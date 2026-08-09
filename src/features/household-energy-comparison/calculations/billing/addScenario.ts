import type {
  EnergyAssets,
  HouseholdAssessment,
} from 'features/household-energy-comparison/models/schema'
import type {
  HouseholdScenario,
  ScenarioId,
} from 'features/household-energy-comparison/models/householdScenarios'

export const addScenario = (
  assessment: HouseholdAssessment,
  id: ScenarioId,
  label: string,
  description: string,
  proposed: EnergyAssets,
): HouseholdScenario => ({
  id,
  label,
  description,
  household: assessment.household,
  assets: { ...assessment.current, ...proposed },
})
