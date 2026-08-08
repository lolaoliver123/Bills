import {HouseholdEnergyComparisonProvider} from "features/household-energy-comparison";
import {AppRouter} from "app/router";

const App = () => (
    <HouseholdEnergyComparisonProvider>
        <AppRouter/>
    </HouseholdEnergyComparisonProvider>
);

export default App;
