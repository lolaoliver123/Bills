import {Navigate, Route, Routes} from "react-router-dom";
import {HouseholdComparisonResultsPage, HouseholdSetupPage} from "@/features/household-energy-comparison";

export const AppRouter = () => (
    <Routes>
        <Route path="/" element={<HouseholdSetupPage/>}/>
        <Route path="/results" element={<HouseholdComparisonResultsPage/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
);
