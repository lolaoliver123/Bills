import {Form, Formik, type FormikErrors, setIn} from "formik";
import {useState} from "react";
import {
    type HouseholdAssessment,
    type HouseholdFormDraft,
    householdFormSchema,
    initialValues,
    toHouseholdAssessment,
} from "./forms/householdSetup/schema";
import {HouseholdFields} from "./forms/householdSetup/components/Household.tsx";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NetBarChart from "@/components/graph/Graph.tsx";
import {buildFinancialComparison} from "@/components/graph/billing.ts";
import {buildHouseholdScenarios} from "@/forms/householdSetup/householdScenarios.ts";

const validationErrors = (values: HouseholdFormDraft): FormikErrors<HouseholdFormDraft> => {
    const result = householdFormSchema.safeParse(values);
    if (result.success) return {};

    return result.error.issues.reduce<FormikErrors<HouseholdFormDraft>>(
        (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
        {},
    );
};

const currency = new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"});
const number = new Intl.NumberFormat("en-GB", {maximumFractionDigits: 0});

const formatNetCost = (value: number) => value < 0
    ? `${currency.format(Math.abs(value))} credit`
    : currency.format(value);

const formatSavings = (value: number) => value >= 0
    ? currency.format(value)
    : `-${currency.format(Math.abs(value))}`;

const App = () => {
    const [assessment, setAssessment] = useState<HouseholdAssessment | null>(null);
    const scenarios = assessment ? buildHouseholdScenarios(assessment) : [];
    const comparison = assessment
        ? buildFinancialComparison(scenarios, assessment.household.monthlyElectricityCost)
        : null;

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
            <main className="mx-auto w-full max-w-6xl space-y-8">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader className="gap-2">
                        <CardTitle className="text-2xl sm:text-3xl">Household setup</CardTitle>
                        <CardDescription>Tell us about the household’s energy equipment and monthly bills.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Formik initialValues={initialValues} validate={validationErrors}
                                onSubmit={(values) => setAssessment(toHouseholdAssessment(values))}>
                            <Form noValidate className="space-y-8">
                                <HouseholdFields/>
                                <Button type="submit" size="lg">See how much you could save</Button>
                            </Form>
                        </Formik>
                    </CardContent>
                </Card>

                {comparison && "kind" in comparison ? (
                    <Card className="border-destructive/40">
                        <CardHeader>
                            <CardTitle>Unable to estimate bills</CardTitle>
                            <CardDescription>{comparison.message} Check the monthly bill and try again.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : comparison ? (
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
                ) : null}
            </main>
        </div>
    );
};

export default App;
