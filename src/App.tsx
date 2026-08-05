import { Formik, Form, setIn, useField, useFormikContext, type FormikErrors } from "formik";
import { useEffect } from "react";
import "./App.css";
import { initialValues, schema, withCalculatedFields, type Household } from "./forms/householdSetup/schema";

function validationErrors(values: Household): FormikErrors<Household> {
  const result = schema.safeParse(values);
  if (result.success) return {};

  return result.error.issues.reduce<FormikErrors<Household>>(
    (errors, issue) => setIn(errors, issue.path.join("."), issue.message),
    {},
  );
}

function BooleanField({ name, label }: { name: string; label: string }) {
  const [field, meta, helpers] = useField<boolean | undefined>(name);

  return (
    <fieldset className="field boolean-field">
      <legend>{label}</legend>
      <label>
        <input
          type="radio"
          name={name}
          checked={field.value === true}
          onChange={() => helpers.setValue(true)}
          onBlur={() => helpers.setTouched(true)}
        />
        Yes
      </label>
      <label>
        <input
          type="radio"
          name={name}
          checked={field.value === false}
          onChange={() => helpers.setValue(false)}
          onBlur={() => helpers.setTouched(true)}
        />
        No
      </label>
      {meta.touched && meta.error ? <span className="error">{meta.error}</span> : null}
    </fieldset>
  );
}

function NumberField({ name, label, unit }: { name: string; label: string; unit?: string }) {
  const [field, meta, helpers] = useField<number | undefined>(name);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-unit">
        <input
          id={name}
          name={name}
          type="number"
          min="0"
          step="any"
          value={field.value ?? ""}
          onBlur={field.onBlur}
          onChange={(event) => helpers.setValue(event.target.value === "" ? undefined : Number(event.target.value))}
        />
        {unit ? <span>{unit}</span> : null}
      </div>
      {meta.touched && meta.error ? <span className="error">{meta.error}</span> : null}
    </label>
  );
}

function CalculatedField({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-unit">
        <input type="number" value={value ?? ""} readOnly aria-label={label} />
        {unit ? <span>{unit}</span> : null}
      </div>
    </label>
  );
}

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

function HouseholdFields() {
  const { values } = useFormikContext<Household>();

  return (
    <>
      <BooleanField name="hasGas" label="Does the household have gas?" />
      {values.hasGas ? (
        <section className="conditional-section">
          <BooleanField name="hasGasHeating" label="Is the gas used for heating?" />
          <NumberField name="gasCost" label="Monthly gas bill" unit="£" />
        </section>
      ) : null}

      <BooleanField name="hasSolar" label="Does the household have solar panels?" />
      {values.hasSolar ? (
        <section className="conditional-section">
          <h2>Solar panels</h2>
          <NumberField name="solar.averageIndividualPanelOutput" label="Average individual panel output" unit="kW" />
          <NumberField name="solar.numberOfPanels" label="Number of panels" />
          <CalculatedField label="Total solar output" value={values.solar.valueOfTotalOutput} unit="kW" />
        </section>
      ) : null}

      <BooleanField name="hasHeatPump" label="Does the household have a heat pump?" />
      {values.hasHeatPump ? (
        <section className="conditional-section">
          <h2>Heat pump</h2>
          <NumberField name="heatPump.capacityKw" label="Capacity" unit="kW" />
        </section>
      ) : null}

      <BooleanField name="hasBatteries" label="Does the household have batteries?" />
      {values.hasBatteries ? (
        <section className="conditional-section">
          <h2>Battery storage</h2>
          <NumberField name="battery.averageBatteryCapacity" label="Average battery capacity" unit="kWh" />
          <NumberField name="battery.numberOfBatteries" label="Number of batteries" />
          <CalculatedField label="Total storage" value={values.battery.totalStorage} unit="kWh" />
        </section>
      ) : null}

      <BooleanField name="hasElectricVehicle" label="Does the household have an electric vehicle?" />
      {values.hasElectricVehicle ? (
        <section className="conditional-section">
          <h2>Electric vehicle</h2>
          <NumberField name="electricVehicle.batteryCapacity" label="Battery capacity" unit="kWh" />
          <NumberField name="electricVehicle.numberOfTotalChargesPerWeek" label="Charges per week" />
          <BooleanField name="electricVehicle.isVoltageToGrid" label="Can it supply electricity back to the grid?" />
        </section>
      ) : null}

      <NumberField name="electricCost" label="Monthly electricity bill" unit="£" />
    </>
  );
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
