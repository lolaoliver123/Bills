import {Card, CardDescription, CardHeader, CardTitle} from "components/ui/card.tsx";
import type {CalibrationError, FinancialComparison} from "features/household-energy-comparison/models/billing.ts";
import {ComparisonResultHeader} from "features/household-energy-comparison/components/ComparisonResults/ComparisonResultHeader.tsx";
import {ComparisonResultContent} from "features/household-energy-comparison/components/ComparisonResults/ComparisonResultContent.tsx";
import {EstimatedElectricityDemand} from "features/household-energy-comparison/components/ComparisonResults/EstimatedElectricityDemand.tsx";


export const ComparisonResults = ({comparison}: {
    comparison: FinancialComparison | CalibrationError;
}) => {
    if ("kind" in comparison) {
        return (
            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle>Unable to estimate bills</CardTitle>
                    <CardDescription>{comparison.message} Check the monthly bill and try again.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <section className="grid gap-8" aria-label="Estimated household energy comparison">
            <EstimatedElectricityDemand
                inferredDailyDemandKwh={comparison.inferredDailyDemandKwh}
                value={comparison.inferredAnnualDemandKwh}
            />
            {comparison.results.map(({scenario, energyFlows, bill, monthlySavings, annualSavings}) => (
                <Card key={scenario.id}>
                    <ComparisonResultHeader scenario={scenario}/>
                    <ComparisonResultContent
                        bill={bill}
                        value={monthlySavings}
                        value1={annualSavings}
                        data={energyFlows}
                    />
                </Card>
            ))}
        </section>
    );
};
