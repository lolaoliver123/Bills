import {useFormikContext} from "formik";
import type {Household} from "../schema.ts";
import {BooleanField} from "./Boolean.tsx";
import {NumberField} from "./Number.tsx";
import {CalculatedField} from "./Calculated.tsx";

const HouseholdFields = () => {
    const {values} = useFormikContext<Household>();

    return (
        <>
            <BooleanField name="hasGas" label="Does the household have gas?"/>
            {values.hasGas ? (
                <section className="conditional-section">
                    <BooleanField name="hasGasHeating" label="Is the gas used for heating?"/>
                    <NumberField name="gasCost" label="Monthly gas bill" unit="£"/>
                </section>
            ) : null}

            <BooleanField name="hasSolar" label="Does the household have solar panels?"/>
            {values.hasSolar ? (
                <section className="conditional-section">
                    <h2>Solar panels</h2>
                    <NumberField name="solar.averageIndividualPanelOutput" label="Average individual panel output"
                                 unit="kW"/>
                    <NumberField name="solar.numberOfPanels" label="Number of panels"/>
                    <CalculatedField label="Total solar output" value={values.solar.valueOfTotalOutput} unit="kW"/>
                </section>
            ) : null}

            <BooleanField name="hasHeatPump" label="Does the household have a heat pump?"/>
            {values.hasHeatPump ? (
                <section className="conditional-section">
                    <h2>Heat pump</h2>
                    <NumberField name="heatPump.capacityKw" label="Capacity" unit="kW"/>
                </section>
            ) : null}

            <BooleanField name="hasBatteries" label="Does the household have batteries?"/>
            {values.hasBatteries ? (
                <section className="conditional-section">
                    <h2>Battery storage</h2>
                    <NumberField name="battery.averageBatteryCapacity" label="Average battery capacity" unit="kWh"/>
                    <NumberField name="battery.numberOfBatteries" label="Number of batteries"/>
                    <CalculatedField label="Total storage" value={values.battery.totalStorage} unit="kWh"/>
                </section>
            ) : null}

            <BooleanField name="hasElectricVehicle" label="Does the household have an electric vehicle?"/>
            {values.hasElectricVehicle ? (
                <section className="conditional-section">
                    <h2>Electric vehicle</h2>
                    <NumberField name="electricVehicle.batteryCapacity" label="Battery capacity" unit="kWh"/>
                    <NumberField name="electricVehicle.numberOfTotalChargesPerWeek" label="Charges per week"/>
                    <BooleanField name="electricVehicle.isVoltageToGrid"
                                  label="Can it supply electricity back to the grid?"/>
                </section>
            ) : null}

            <NumberField name="electricCost" label="Monthly electricity bill" unit="£"/>
        </>
    );
};
export default HouseholdFields
