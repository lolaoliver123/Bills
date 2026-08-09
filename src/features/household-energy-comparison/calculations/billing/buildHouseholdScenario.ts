import type { HouseholdAssessment } from 'features/household-energy-comparison/models/schema'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import { addScenario } from './addScenario'

export const buildHouseholdScenarios = (assessment: HouseholdAssessment): HouseholdScenario[] => {
  const scenarios = [
    addScenario(
      assessment,
      'current',
      'Current household',
      'Estimated usage for an average day based on your answers.',
      {},
    ),
  ]

  if (assessment.proposed.solar) {
    scenarios.push(
      addScenario(
        assessment,
        'solar',
        'With proposed solar',
        'Estimated usage with the proposed solar panel system.',
        { solar: assessment.proposed.solar },
      ),
    )
  }
  if (assessment.proposed.battery) {
    scenarios.push(
      addScenario(
        assessment,
        'battery',
        'With proposed battery',
        'Estimated usage with the proposed battery storage system.',
        { battery: assessment.proposed.battery },
      ),
    )
  }
  if (assessment.proposed.solar && assessment.proposed.battery) {
    scenarios.push(
      addScenario(
        assessment,
        'solar-battery',
        'With proposed solar and battery',
        'Estimated usage with both proposed solar panel and battery systems installed.',
        { solar: assessment.proposed.solar, battery: assessment.proposed.battery },
      ),
    )
  }

  return scenarios
}
