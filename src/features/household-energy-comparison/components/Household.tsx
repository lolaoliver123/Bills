import {useFormikContext} from "formik";
import {
    getBatteryCapacityKwh,
    getSolarCapacityKw,
    PROPOSED_SOLAR_PANEL_CAPACITY_KW,
    type BatterySystem,
    type HouseholdFormDraft,
    type SolarSystem,
} from "@/features/household-energy-comparison/models/schema.ts";
import {BooleanField} from "./Boolean.tsx";
import {NumberField} from "./Number.tsx";
import {CalculatedField} from "./Calculated.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

const DetailCard = ({title, children}: { title: string; children: React.ReactNode }) => (
    <Card className="border-primary/15 bg-muted/30 shadow-none">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
);

const solarCapacity = (values: HouseholdFormDraft): number | undefined => {
    if (values.hasSolar === undefined || values.solar.panelCount === undefined) return undefined;
    const panelCapacityKw = values.hasSolar
        ? values.solar.panelCapacityKw
        : PROPOSED_SOLAR_PANEL_CAPACITY_KW;
    if (panelCapacityKw === undefined) return undefined;
    return getSolarCapacityKw({panelCount: values.solar.panelCount, panelCapacityKw} satisfies SolarSystem);
};

const batteryCapacity = (values: HouseholdFormDraft): number | undefined => {
    if (values.battery.unitCount === undefined || values.battery.unitCapacityKwh === undefined) return undefined;
    return getBatteryCapacityKwh({
        unitCount: values.battery.unitCount,
        unitCapacityKwh: values.battery.unitCapacityKwh,
    } satisfies BatterySystem);
};

export const HouseholdFields = () => {
    const {values} = useFormikContext<HouseholdFormDraft>();

    return (
        <div className="grid gap-6">
            <NumberField name="heatPump.capacityKw" label="Heat pump capacity" unit="kW"/>

            <BooleanField name="hasSolar" label="Does the household have solar panels?"/>
            {values.hasSolar !== undefined ? (
                <DetailCard title={values.hasSolar ? "Installed solar panels" : "Proposed solar panels"}>
                    {values.hasSolar ? (
                        <NumberField name="solar.panelCapacityKw" label="Average individual panel output" unit="kW"/>
                    ) : (
                        <CalculatedField label="Assumed output per panel"
                                         value={PROPOSED_SOLAR_PANEL_CAPACITY_KW} unit="kW"/>
                    )}
                    <NumberField name="solar.panelCount" label="Number of panels"/>
                    <CalculatedField label="Total solar capacity" value={solarCapacity(values)} unit="kW"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasBatteries" label="Does the household have batteries?"/>
            {values.hasBatteries !== undefined ? (
                <DetailCard title={values.hasBatteries ? "Installed battery storage" : "Proposed battery storage"}>
                    <NumberField name="battery.unitCapacityKwh" label="Average battery capacity" unit="kWh"/>
                    <NumberField name="battery.unitCount" label="Number of batteries"/>
                    <CalculatedField label="Total storage capacity" value={batteryCapacity(values)} unit="kWh"/>
                </DetailCard>
            ) : null}

            <BooleanField name="hasElectricVehicle" label="Does the household have an electric vehicle?"/>
            {values.hasElectricVehicle ? (
                <DetailCard title="Electric vehicle">
                    <NumberField name="electricVehicle.batteryCapacityKwh" label="Battery capacity" unit="kWh"/>
                    <NumberField name="electricVehicle.chargesPerWeek" label="Charges per week"/>
                    <BooleanField name="electricVehicle.canSupplyGrid"
                                  label="Can it supply electricity back to the grid?"/>
                </DetailCard>
            ) : null}

            <NumberField name="monthlyElectricityCost" label="Monthly electricity bill" unit="£"/>
        </div>
    );
};
