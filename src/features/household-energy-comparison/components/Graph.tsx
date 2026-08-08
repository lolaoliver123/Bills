import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import { BATTERY_ASSUMPTIONS } from 'features/household-energy-comparison/calculations/simulation/config'

type NetBarChartProps = {
  data: HourlyEnergyFlow[]
}

const HOUR_TICKS = Array.from({ length: 6 }, (_, index) => index * 4)

export const NetBarChart = ({ data }: NetBarChartProps) => {
  const chartData = data.map((flow) => ({
    hour: flow.hour,
    electricity: Math.max(
      0,
      flow.electricityDemandKwh - flow.heatPumpDemandKwh - flow.evChargeKwh,
    ),
    heatPump: flow.heatPumpDemandKwh,
    evCharge: flow.evChargeKwh,
    evDischarge: -flow.evDischargeKwh,
    solar: -flow.solarGenerationKwh,
    batteryCharge: flow.batteryChargeKwh,
    batteryDischarge: -flow.batteryDischargeKwh,
  }))

  return (
    <BarChart
      width={1000}
      height={600}
      data={chartData}
      stackOffset="sign"
      margin={{ top: 36, right: 32, left: 32, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="hour"
        type="number"
        domain={[-0.5, 23.5]}
        ticks={HOUR_TICKS}
        interval={0}
        height={42}
        tickMargin={10}
        allowDecimals={false}
        tickFormatter={(hour) => `${String(hour).padStart(2, '0')}:00`}
      />
      <YAxis unit=" kWh" />
      <Tooltip />
      <ReferenceArea
        x1={BATTERY_ASSUMPTIONS.cheapStartHour - 0.5}
        x2={BATTERY_ASSUMPTIONS.cheapEndHour - 0.5}
        fill="var(--chart-cheap-window)"
        fillOpacity={0.16}
        strokeOpacity={0}
        label={{
          value: 'Cheap hours',
          position: 'insideTop',
          fill: 'var(--question)',
          fontWeight: 600,
          fontSize: 12,
        }}
      />
      <ReferenceArea
        x1={BATTERY_ASSUMPTIONS.peakStartHour - 0.5}
        x2={BATTERY_ASSUMPTIONS.peakEndHour - 0.5}
        fill="var(--chart-peak-window)"
        fillOpacity={0.13}
        strokeOpacity={0}
        label={{
          value: 'Peak hours',
          position: 'insideTop',
          fill: 'var(--chart-peak-window)',
          fontWeight: 600,
          fontSize: 12,
        }}
      />
      <ReferenceLine y={0} stroke="#000" />
      <Bar
        dataKey="heatPump"
        name="Heat pump demand"
        fill="var(--chart-heat-pump)"
        stackId="energy"
      />
      <Bar
        dataKey="electricity"
        name="Electricity demand"
        fill="var(--chart-electricity)"
        stackId="energy"
      />
      <Bar dataKey="evCharge" name="EV charging" fill="var(--chart-ev)" stackId="energy" />
      <Bar dataKey="evDischarge" name="EV discharging" fill="var(--chart-ev)" stackId="energy" />
      <Bar
        dataKey="batteryCharge"
        name="Battery charging"
        fill="var(--chart-battery)"
        stackId="energy"
      />
      <Bar
        dataKey="batteryDischarge"
        name="Battery discharging"
        fill="var(--chart-battery)"
        stackId="energy"
      />
      <Bar dataKey="solar" name="Solar generation" fill="var(--chart-solar)" stackId="energy" />
    </BarChart>
  )
}
