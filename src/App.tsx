import { Formik, Form, setIn, useFormikContext, type FormikErrors } from "formik";
import { useEffect } from "react";
import "./App.css";
import { initialValues, schema, withCalculatedFields, type Household } from "./forms/householdSetup/schema";
import HouseholdFields from "./forms/householdSetup/components/Household.tsx";

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
    <main className="household-form">
      <h1>Household setup</h1>
      <p>Tell us about the household’s energy equipment and monthly bills.</p>

      <Formik initialValues={initialValues} validate={validationErrors} onSubmit={downloadHousehold}>
        <Form noValidate>
          <KeepCalculatedFieldsInSync />
          <HouseholdFields />
          <button type="submit">Download household.json</button>
        </Form>
      </Formik>
    </main>
  );
}

export default App;
