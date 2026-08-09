import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type {
  HourlyEnergyFlow,
  SimulationOptions,
} from 'features/household-energy-comparison/models/simulation'
import { buildEnergyProfiles } from './buildEnergyProfiles'
import { buildStoragePlan } from './buildStoragePlan'
import { dispatchEnergy } from './dispatchEnergy'

export const simulateDailyEnergy = (
  scenario: HouseholdScenario,
  { demandScale = 1, tariff = DEFAULT_ELECTRICITY_TARIFF }: SimulationOptions = {},
): HourlyEnergyFlow[] => {
  const profiles = buildEnergyProfiles(scenario, demandScale)
  const storagePlan = buildStoragePlan(scenario, tariff, profiles)

  return dispatchEnergy(scenario, tariff, profiles, storagePlan)
}
