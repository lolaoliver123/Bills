import { createContext, useContext } from 'react'
import type {
  HouseholdAssessment,
  HouseholdFormDraft,
} from 'features/household-energy-comparison/models/schema'

export type HouseholdEnergyComparisonContextValue = {
  draft: HouseholdFormDraft
  assessment: HouseholdAssessment | null
  submitDraft: (draft: HouseholdFormDraft) => void
}

export const HouseholdEnergyComparisonContext =
  createContext<HouseholdEnergyComparisonContextValue | null>(null)

export const useHouseholdEnergyComparison = (): HouseholdEnergyComparisonContextValue => {
  const context = useContext(HouseholdEnergyComparisonContext)
  if (!context) {
    throw new Error(
      'useHouseholdEnergyComparison must be used within HouseholdEnergyComparisonProvider',
    )
  }
  return context
}
