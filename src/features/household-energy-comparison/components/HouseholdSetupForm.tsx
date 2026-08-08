import {Form, Formik, type FormikErrors, setIn} from "formik";
import {Button} from "components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "components/ui/card";
import {
    type HouseholdFormDraft,
    householdFormSchema,
} from "features/household-energy-comparison/models/schema";
import {HouseholdFields} from "features/household-energy-comparison/components/Household";

const validationErrors = (values: HouseholdFormDraft): FormikErrors<HouseholdFormDraft> => {
    const result = householdFormSchema.safeParse(values);
    if (result.success) return {};

    return result.error.issues.reduce<FormikErrors<HouseholdFormDraft>>(
        (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
        {},
    );
};

export const HouseholdSetupForm = ({initialValues, onSubmit}: {
    initialValues: HouseholdFormDraft;
    onSubmit: (draft: HouseholdFormDraft) => void;
}) => (
    <Card className="mx-auto max-w-2xl">
        <CardHeader className="gap-2">
            <CardTitle className="text-2xl sm:text-3xl ">Solar and Battery Savings Calculator</CardTitle>
            <CardDescription>Tell us about this household’s energy equipment and monthly bills.</CardDescription>
        </CardHeader>
        <CardContent>
            <Formik initialValues={initialValues} validate={validationErrors} onSubmit={onSubmit}>
                <Form noValidate className="space-y-8">
                    <HouseholdFields/>
                    <Button type="submit" size="lg"
                            className="bg-[#79db8e] text-slate-950 hover:bg-[#79db8e]/80">
                        See how much you could save
                    </Button>
                </Form>
            </Formik>
        </CardContent>
    </Card>
);
