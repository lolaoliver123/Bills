import { Bar, BarChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'

type NetBarChartProps = {
  data: HourlyEnergyFlow[]
}

export const NetBarChart = ({ data }: NetBarChartProps) => {
  const chartData = data.map((flow) => ({
    hour: flow.hour,
    electricity: Math.max(0, flow.electricityDemandKwh - flow.heatPumpDemandKwh),
    heatPump: flow.heatPumpDemandKwh,
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
      margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="hour"
        type="number"
        domain={[(dataMin) => dataMin - 0.5, (dataMax) => dataMax + 0.5]}
        tickCount={24}
        tickFormatter={(hour) => `${String(hour).padStart(2, '0')}:00`}
      />
      <YAxis unit=" kWh" />
      <Tooltip />
      <ReferenceLine y={0} stroke="#000" />
      <Bar
        dataKey="electricity"
        name="Electricity demand"
        fill="var(--chart-electricity)"
        stackId="energy"
      />
      <Bar
        dataKey="heatPump"
        name="Heat pump demand"
        fill="var(--chart-heat-pump)"
        stackId="energy"
      />
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
