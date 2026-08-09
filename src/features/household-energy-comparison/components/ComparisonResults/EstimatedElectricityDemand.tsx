import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card'
import { formatCalculatedValue } from 'features/household-energy-comparison/components/formatCalculatedValue'

export const EstimatedElectricityDemand = (props: {
  inferredDailyDemandKwh: number
  value: number
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Estimated electricity demand</CardTitle>
      <CardDescription>
        Inferred from the current monthly supplier bill using the representative daily profile.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-1 sm:grid-cols-2">
      <p>
        <span className="font-semibold">Daily:</span>{' '}
        {formatCalculatedValue(props.inferredDailyDemandKwh)} kWh
      </p>
      <p>
        <span className="font-semibold">Annual:</span> {formatCalculatedValue(props.value)} kWh
      </p>
    </CardContent>
  </Card>
)
