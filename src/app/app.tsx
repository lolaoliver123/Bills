import { HouseholdEnergyComparisonProvider } from 'features/household-energy-comparison'
import { AppRouter } from './router'

export const App = () => (
  <HouseholdEnergyComparisonProvider>
    <AppRouter />
  </HouseholdEnergyComparisonProvider>
)
