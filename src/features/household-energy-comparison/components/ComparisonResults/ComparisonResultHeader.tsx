import type {HouseholdScenario} from "features/household-energy-comparison/models/householdScenarios.ts";
import {CardDescription, CardHeader, CardTitle} from "components/ui/card.tsx";

export const ComparisonResultHeader = (props: { scenario: HouseholdScenario }) => {
    return (
        <CardHeader>
            <CardTitle>{props.scenario.label}</CardTitle>
            <CardDescription>{props.scenario.description}</CardDescription>
        </CardHeader>
    )
};
