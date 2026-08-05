import {useFormikContext} from "formik";
import type {Household} from "../schema.ts";
import {BooleanField} from "./Boolean.tsx";
import {NumberField} from "./Number.tsx";
import {CalculatedField} from "./Calculated.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="border-primary/15 bg-muted/30 shadow-none">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
            {children}
        </CardContent>
    </Card>
);

const HouseholdFields = () => {
    const {values} = useFormikContext<Household>();

    return (
        <div className="grid gap-6">
            <BooleanField name="hasGas" label="Does the household have gas?"/>
            {values.hasGas ? (
                <DetailCard title="Gas supply">
                    <BooleanField name="hasGasHeating" label="Is the gas used for heating?"/>
                    <NumberField name="gasCost" label="Monthly gas bill" unit="£"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasSolar" label="Does the household have solar panels?"/>
            {values.hasSolar ? (
                <DetailCard title="Solar panels">
                    <NumberField name="solar.averageIndividualPanelOutput" label="Average individual panel output"
                                 unit="kW"/>
                    <NumberField name="solar.numberOfPanels" label="Number of panels"/>
                    <CalculatedField label="Total solar output" value={values.solar.valueOfTotalOutput} unit="kW"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasHeatPump" label="Does the household have a heat pump?"/>
            {values.hasHeatPump ? (
                <DetailCard title="Heat pump">
                    <NumberField name="heatPump.capacityKw" label="Capacity" unit="kW"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasBatteries" label="Does the household have batteries?"/>
            {values.hasBatteries ? (
                <DetailCard title="Battery storage">
                    <NumberField name="battery.averageBatteryCapacity" label="Average battery capacity" unit="kWh"/>
                    <NumberField name="battery.numberOfBatteries" label="Number of batteries"/>
                    <CalculatedField label="Total storage" value={values.battery.totalStorage} unit="kWh"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasElectricVehicle" label="Does the household have an electric vehicle?"/>
            {values.hasElectricVehicle ? (
                <DetailCard title="Electric vehicle">
                    <NumberField name="electricVehicle.batteryCapacity" label="Battery capacity" unit="kWh"/>
                    <NumberField name="electricVehicle.numberOfTotalChargesPerWeek" label="Charges per week"/>
                    <BooleanField name="electricVehicle.isVoltageToGrid"
                                  label="Can it supply electricity back to the grid?"/>
                </DetailCard>
            ) : null}

            <NumberField name="electricCost" label="Monthly electricity bill" unit="£"/>
        </div>
    );
};
export default HouseholdFields
