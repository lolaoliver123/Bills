import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import type {CalibrationError, FinancialComparison} from "@/features/household-energy-comparison/models/billing.ts";
import NetBarChart from "./Graph";

const currency = new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"});
const number = new Intl.NumberFormat("en-GB", {maximumFractionDigits: 0});

const formatNetCost = (value: number) => value < 0
    ? `${currency.format(Math.abs(value))} credit`
    : currency.format(value);

const formatSavings = (value: number) => value >= 0
    ? currency.format(value)
    : `-${currency.format(Math.abs(value))}`;

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
            <Card>
                <CardHeader>
                    <CardTitle>Estimated electricity demand</CardTitle>
                    <CardDescription>
                        Inferred from the current monthly supplier bill using the representative daily profile.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-1 sm:grid-cols-2">
                    <p><span className="font-semibold">Daily:</span> {comparison.inferredDailyDemandKwh.toFixed(1)} kWh</p>
                    <p><span className="font-semibold">Annual:</span> {number.format(comparison.inferredAnnualDemandKwh)} kWh</p>
                </CardContent>
            </Card>
            {comparison.results.map(({scenario, energyFlows, bill, monthlySavings, annualSavings}) => (
                <Card key={scenario.id}>
                    <CardHeader>
                        <CardTitle>{scenario.label}</CardTitle>
                        <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 overflow-x-auto">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly supplier bill</p>
                                <p className="text-xl font-semibold">{currency.format(bill.monthly.supplierBill)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly export earnings</p>
                                <p className="text-xl font-semibold">{currency.format(bill.monthly.exportEarnings)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly net cost</p>
                                <p className="text-xl font-semibold">{formatNetCost(bill.monthly.netCost)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Annual net cost</p>
                                <p className="text-xl font-semibold">{formatNetCost(bill.annual.netCost)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly saving</p>
                                <p className="text-xl font-semibold">{formatSavings(monthlySavings)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Annual saving</p>
                                <p className="text-xl font-semibold">{formatSavings(annualSavings)}</p>
                            </div>
                        </div>
                        <NetBarChart data={energyFlows}/>
                    </CardContent>
                </Card>
            ))}
        </section>
    );
};
