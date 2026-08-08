import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "components/ui/card.tsx";

const number = new Intl.NumberFormat("en-GB", {maximumFractionDigits: 0});

export const EstimatedElectricityDemand = (props: { inferredDailyDemandKwh: number, value: number }) => <Card>
    <CardHeader>
        <CardTitle>Estimated electricity demand</CardTitle>
        <CardDescription>
            Inferred from the current monthly supplier bill using the representative daily profile.
        </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-1 sm:grid-cols-2">
        <p><span className="font-semibold">Daily:</span> {props.inferredDailyDemandKwh.toFixed(1)} kWh
        </p>
        <p><span
            className="font-semibold">Annual:</span> {number.format(props.value)} kWh
        </p>
    </CardContent>
</Card>;
