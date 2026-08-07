import {Form, Formik, type FormikErrors, setIn, useFormikContext} from "formik";
import {useEffect, useState} from "react";
import {type Household, initialValues, schema, withCalculatedFields} from "./forms/householdSetup/schema";
import {HouseholdFields} from "./forms/householdSetup/components/Household.tsx";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NetBarChart from "@/components/graph/Graph.tsx";
import {estimateDailyUsage} from "@/components/graph/tempData.ts";
import {withPotentialSolar} from "@/forms/householdSetup/householdScenarios.ts";

const validationErrors = (values: Household): FormikErrors<Household> => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    return result.error.issues.reduce<FormikErrors<Household>>(
        (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
        {},
    );
};


const KeepCalculatedFieldsInSync = () => {
    const {values, setFieldValue} = useFormikContext<Household>();
    const calculated = withCalculatedFields(values);

    useEffect(() => {
        if (calculated.solar.valueOfTotalOutput !== values.solar.valueOfTotalOutput) {
            void setFieldValue("solar.valueOfTotalOutput", calculated.solar.valueOfTotalOutput, false);
        }
        if (calculated.potentialSolar.valueOfTotalOutput !== values.potentialSolar.valueOfTotalOutput) {
            void setFieldValue("potentialSolar.averageIndividualPanelOutput", calculated.potentialSolar.averageIndividualPanelOutput, false);
            void setFieldValue("potentialSolar.valueOfTotalOutput", calculated.potentialSolar.valueOfTotalOutput, false);
        }
        if (calculated.battery.totalStorage !== values.battery.totalStorage) {
            void setFieldValue("battery.totalStorage", calculated.battery.totalStorage, false);
        }
        if (calculated.potentialBattery.totalStorage !== values.potentialBattery.totalStorage) {
            void setFieldValue("potentialBattery.averageBatteryCapacity", calculated.potentialBattery.totalStorage, false);
            void setFieldValue("potentialBattery.totalStorage", calculated.battery.totalStorage, false);
        }
    }, [
        calculated.battery.totalStorage,
        calculated.solar.valueOfTotalOutput,
        calculated.potentialSolar.averageIndividualPanelOutput,
        calculated.potentialSolar.valueOfTotalOutput,
        setFieldValue,
        values.battery.totalStorage,
        values.potentialBattery.averageBatteryCapacity,
        values.potentialBattery.totalStorage,
        values.solar.valueOfTotalOutput,
        values.potentialSolar.valueOfTotalOutput,
    ]);

    return null;
};

const App = () => {
    const [submittedHousehold, setSubmittedHousehold] = useState<Household | null>(null);

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
            <main className="mx-auto w-full max-w-6xl space-y-8">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader className="gap-2">
                        <CardTitle className="text-2xl sm:text-3xl">Household setup</CardTitle>
                        <CardDescription>Tell us about the household’s energy equipment and monthly
                            bills.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Formik initialValues={initialValues} validate={validationErrors}
                                onSubmit={(values: Household) => {
                                    setSubmittedHousehold(withCalculatedFields(values));
                                }}>
                            <Form noValidate className="space-y-8">
                                <KeepCalculatedFieldsInSync/>
                                <HouseholdFields/>
                                <Button type="submit" size="lg">Download household.json</Button>
                            </Form>
                        </Formik>
                    </CardContent>
                </Card>
                {submittedHousehold ? (
                    <section className="grid gap-8" aria-label="Estimated household energy comparison">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current household</CardTitle>
                                <CardDescription>Estimated usage for an average day based on your
                                    answers.</CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <NetBarChart data={estimateDailyUsage(submittedHousehold)}/>
                            </CardContent>
                        </Card>
                        {submittedHousehold.hasSolar === false ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>With potential solar</CardTitle>
                                    <CardDescription>Estimated usage if the household installed the maximum
                                        number of panels entered above.</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <NetBarChart data={estimateDailyUsage(withPotentialSolar(submittedHousehold))}/>
                                </CardContent>
                            </Card>
                        ) : null}
                    </section>
                ) : null}
            </main>
        </div>
    );
};

export default App;
