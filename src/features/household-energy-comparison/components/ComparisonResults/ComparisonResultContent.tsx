import type { BillEstimate } from 'features/household-energy-comparison/models/billing'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import { CardContent } from 'components/ui/card'
import { NetBarChart } from 'features/household-energy-comparison/components/Graph'
import { ComparisonResultValue } from './ComparisonResultValue'

const currency = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

const formatNetCost = (value: number) =>
  value < 0 ? `${currency.format(Math.abs(value))} credit` : currency.format(value)

const formatSavings = (value: number) =>
  value >= 0 ? currency.format(value) : `-${currency.format(Math.abs(value))}`

export const ComparisonResultContent = (props: {
  bill: BillEstimate
  value: number
  value1: number
  data: HourlyEnergyFlow[]
}) => {
  return (
    <CardContent className="grid gap-6 overflow-x-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ComparisonResultValue
          title="Monthly supplier bill"
          value={currency.format(props.bill.monthly.supplierBill)}
        />
        <ComparisonResultValue
          title="Monthly export earnings"
          value={currency.format(props.bill.monthly.exportEarnings)}
        />
        <ComparisonResultValue
          title="Monthly net cost"
          value={formatNetCost(props.bill.monthly.netCost)}
        />
        <ComparisonResultValue
          title="Annual net cost"
          value={formatNetCost(props.bill.annual.netCost)}
        />
        <ComparisonResultValue title="Monthly saving" value={formatSavings(props.value)} />
        <ComparisonResultValue title="Monthly saving" value={formatSavings(props.value1)} />
      </div>
      <NetBarChart data={props.data} />
    </CardContent>
  )
}
