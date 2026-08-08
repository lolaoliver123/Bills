import {HouseholdEnergyComparisonProvider} from "@/features/household-energy-comparison";
import {AppRouter} from "./router";

const App = () => (
    <HouseholdEnergyComparisonProvider>
        <AppRouter/>
    </HouseholdEnergyComparisonProvider>
);

export default App;
