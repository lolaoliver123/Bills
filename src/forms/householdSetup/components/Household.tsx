import {useFormikContext} from "formik";
import {POTENTIAL_SOLAR_PANEL_CAPACITY_KW, type Household} from "../schema.ts";
import {BooleanField} from "./Boolean.tsx";
import {NumberField} from "./Number.tsx";
import {CalculatedField} from "./Calculated.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

const DetailCard = ({title, children}: { title: string; children: React.ReactNode }) => (
    <Card className="border-primary/15 bg-muted/30 shadow-none">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
            {children}
        </CardContent>
    </Card>
);

export const HouseholdFields = () => {
    const {values} = useFormikContext<Household>();
    return (
        <div className="grid gap-6">
            <NumberField name="heatPump.capacityKw" label="Capacity" unit="kW"/>
            <BooleanField name="hasSolar" label="Does the household have solar panels?"/>
            {values.hasSolar === true ? (
                <DetailCard title="Solar panels">
                    <NumberField name="solar.averageIndividualPanelOutput" label="Average individual panel output"
                                 unit="kW"/>
                    <NumberField name="solar.numberOfPanels" label="Number of panels"/>
                    <CalculatedField label="Total solar output" value={values.solar?.valueOfTotalOutput} unit="kW"/>
                </DetailCard>
            ) : values.hasSolar === false ? (
                <DetailCard title="Potential solar panels">
                    <CalculatedField label="Assumed output per panel"
                                     value={POTENTIAL_SOLAR_PANEL_CAPACITY_KW} unit="kW"/>
                    <NumberField name="potentialSolar.numberOfPanels" label="Number of panels"/>
                    <CalculatedField label="Total potential solar output"
                                     value={values.potentialSolar.valueOfTotalOutput}
                                     unit="kW"/>
                </DetailCard>
            ) : null};


            <BooleanField name="hasBatteries" label="Does the household have batteries?"/>
            {values.hasBatteries == true ? (
                <DetailCard title="Battery storage">
                    <NumberField name="battery.averageBatteryCapacity" label="Average battery capacity" unit="kWh"/>
                    <NumberField name="battery.numberOfBatteries" label="Number of batteries"/>
                    <CalculatedField label="Total storage" value={values.battery?.totalStorage} unit="kWh"/>
                </DetailCard>
            ) : (values.hasBatteries == false ? (
                <DetailCard title="Battery storage">
                    <NumberField name="battery.averageBatteryCapacity" label="Average battery capacity" unit="kWh"/>
                    <NumberField name="battery.numberOfBatteries" label="Number of batteries"/>
                    <CalculatedField label="Total storage" value={values.battery?.totalStorage} unit="kWh"/>
                </DetailCard>
            ) : null)}

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
