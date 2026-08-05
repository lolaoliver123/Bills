import { Formik, Form, setIn, useFormikContext, type FormikErrors } from "formik";
import { useEffect } from "react";
import { initialValues, schema, withCalculatedFields, type Household } from "./forms/householdSetup/schema";
import HouseholdFields from "./forms/householdSetup/components/Household.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const validationErrors = (values: Household): FormikErrors<Household> => {
  const result = schema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<FormikErrors<Household>>(
    (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
    {},
  );
};


function KeepCalculatedFieldsInSync() {
  const { values, setFieldValue } = useFormikContext<Household>();
  const calculated = withCalculatedFields(values);

  useEffect(() => {
    if (calculated.solar.valueOfTotalOutput !== values.solar.valueOfTotalOutput) {
      void setFieldValue("solar.valueOfTotalOutput", calculated.solar.valueOfTotalOutput, false);
    }
    if (calculated.battery.totalStorage !== values.battery.totalStorage) {
      void setFieldValue("battery.totalStorage", calculated.battery.totalStorage, false);
    }
  }, [
    calculated.battery.totalStorage,
    calculated.solar.valueOfTotalOutput,
    setFieldValue,
    values.battery.totalStorage,
    values.solar.valueOfTotalOutput,
  ]);

  return null;
}

function SystemTheme() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => document.documentElement.classList.toggle("dark", mediaQuery.matches);
    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, []);

  return null;
}

function downloadHousehold(values: Household) {
  const result = withCalculatedFields(values);
  const file = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "household.json";
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <SystemTheme />
      <main className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-2xl sm:text-3xl">Household setup</CardTitle>
            <CardDescription>Tell us about the household’s energy equipment and monthly bills.</CardDescription>
          </CardHeader>
          <CardContent>
            <Formik initialValues={initialValues} validate={validationErrors} onSubmit={downloadHousehold}>
              <Form noValidate className="space-y-8">
                <KeepCalculatedFieldsInSync />
                <HouseholdFields />
                <Button type="submit" size="lg">Download household.json</Button>
              </Form>
            </Formik>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;
