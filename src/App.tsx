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
import {simulateDailyEnergy} from "@/components/graph/simulation.ts";
import {buildHouseholdScenarios} from "@/forms/householdSetup/householdScenarios.ts";

const validationErrors = (values: HouseholdFormDraft): FormikErrors<HouseholdFormDraft> => {
    const result = householdFormSchema.safeParse(values);
    if (result.success) return {};

    return result.error.issues.reduce<FormikErrors<HouseholdFormDraft>>(
        (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
        {},
    );
};

const App = () => {
    const [assessment, setAssessment] = useState<HouseholdAssessment | null>(null);
    const scenarios = assessment ? buildHouseholdScenarios(assessment) : [];

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

                {scenarios.length > 0 ? (
                    <section className="grid gap-8" aria-label="Estimated household energy comparison">
                        {scenarios.map((scenario) => (
                            <Card key={scenario.id}>
                                <CardHeader>
                                    <CardTitle>{scenario.label}</CardTitle>
                                    <CardDescription>{scenario.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <NetBarChart data={simulateDailyEnergy(scenario)}/>
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
