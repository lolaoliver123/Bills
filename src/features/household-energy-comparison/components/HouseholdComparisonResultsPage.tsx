import {ArrowLeft} from "lucide-react";
import {Navigate, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {useHouseholdEnergyComparison} from "../context";
import {buildHouseholdScenarios} from "@/features/household-energy-comparison/models/householdScenarios";
import {ComparisonResults} from "./ComparisonResults";
import {
    buildFinancialComparison
} from "@/features/household-energy-comparison/calculations/billing/buildFinancialComparison.ts";

export const HouseholdComparisonResultsPage = () => {
    const navigate = useNavigate();
    const {assessment} = useHouseholdEnergyComparison();

    if (!assessment) return <Navigate to="/" replace/>;

    const comparison = buildFinancialComparison(
        buildHouseholdScenarios(assessment),
        assessment.household.monthlyElectricityCost,
    );

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
            <main className="mx-auto w-full max-w-6xl space-y-8">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft aria-hidden="true"/>
                    Back
                </Button>
                <ComparisonResults comparison={comparison}/>
            </main>
        </div>
    );
};
