import {useState} from "react";
import {buildFinancialComparison} from "../lib/billing";
import {buildHouseholdScenarios} from "../model/householdScenarios";
import type {HouseholdAssessment} from "../model/schema";
import {ComparisonResults} from "./ComparisonResults";
import {HouseholdSetupForm} from "./HouseholdSetupForm";

export const HouseholdEnergyComparison = () => {
    const [assessment, setAssessment] = useState<HouseholdAssessment | null>(null);
    const comparison = assessment
        ? buildFinancialComparison(
            buildHouseholdScenarios(assessment),
            assessment.household.monthlyElectricityCost,
        )
        : null;

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
            <main className="mx-auto w-full max-w-6xl space-y-8">
                <HouseholdSetupForm onSubmit={setAssessment}/>
                {comparison ? <ComparisonResults comparison={comparison}/> : null}
            </main>
        </div>
    );
};
