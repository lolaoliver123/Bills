import type {BillEstimate} from "features/household-energy-comparison/models/billing.ts";
import type {HourlyEnergyFlow} from "features/household-energy-comparison/models/simulation.ts";
import {CardContent} from "components/ui/card.tsx";
import {NetBarChart} from "features/household-energy-comparison/components/Graph.tsx";

const currency = new Intl.NumberFormat("en-GB", {style: "currency", currency: "GBP"});

const formatNetCost = (value: number) => value < 0
    ? `${currency.format(Math.abs(value))} credit`
    : currency.format(value);

const formatSavings = (value: number) => value >= 0
    ? currency.format(value)
    : `-${currency.format(Math.abs(value))}`;

export const ComparisonResultContent = (props: {
    bill: BillEstimate,
    value: number,
    value1: number,
    data: HourlyEnergyFlow[]
}) => {
    return (
        <CardContent className="grid gap-6 overflow-x-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
            <p className="text-sm text-muted-foreground">Monthly supplier bill</p>
    <p className="text-xl font-semibold">{currency.format(props.bill.monthly.supplierBill)}</p>
    </div>
    <div>
    <p className="text-sm text-muted-foreground">Monthly export earnings</p>
    <p className="text-xl font-semibold">{currency.format(props.bill.monthly.exportEarnings)}</p>
    </div>
    <div>
    <p className="text-sm text-muted-foreground">Monthly net cost</p>
    <p className="text-xl font-semibold">{formatNetCost(props.bill.monthly.netCost)}</p>
    </div>
    <div>
    <p className="text-sm text-muted-foreground">Annual net cost</p>
    <p className="text-xl font-semibold">{formatNetCost(props.bill.annual.netCost)}</p>
    </div>
    <div>
    <p className="text-sm text-muted-foreground">Monthly saving</p>
    <p className="text-xl font-semibold">{formatSavings(props.value)}</p>
    </div>
    <div>
    <p className="text-sm text-muted-foreground">Annual saving</p>
    <p className="text-xl font-semibold">{formatSavings(props.value1)}</p>
    </div>
    </div>
    <NetBarChart data={props.data}/>
    </CardContent>
)
};
