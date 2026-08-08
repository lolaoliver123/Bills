import {HouseholdEnergyComparisonProvider} from "features/household-energy-comparison";
import {AppRouter} from "app/router";

export const App = () => (
    <HouseholdEnergyComparisonProvider>
        <AppRouter/>
    </HouseholdEnergyComparisonProvider>
);
