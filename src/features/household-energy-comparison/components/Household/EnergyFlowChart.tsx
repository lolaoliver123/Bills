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
import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'
import { formatCalculatedValue } from 'features/household-energy-comparison/components/formatCalculatedValue'
import { getHourWindowSegments } from 'features/household-energy-comparison/calculations/tariff'

type NetBarChartProps = {
  data: HourlyEnergyFlow[]
}

const HOUR_TICKS = Array.from({ length: 6 }, (_, index) => index * 4)

const TariffWindow = (props: {
  startHour: number
  endHour: number
  fill: string
  fillOpacity: number
  label: string
  labelFill: string
}) =>
  getHourWindowSegments(props.startHour, props.endHour).map((segment, index) => (
    <ReferenceArea
      key={`${props.label}-${segment.startHour}`}
      x1={segment.startHour - 0.5}
      x2={segment.endHour - 0.5}
      fill={props.fill}
      fillOpacity={props.fillOpacity}
      strokeOpacity={0}
      label={
        index === 0
          ? {
              value: props.label,
              position: 'insideTop',
              fill: props.labelFill,
              fontWeight: 600,
              fontSize: 12,
            }
          : undefined
      }
    />
  ))

export const NetBarChart = ({ data }: NetBarChartProps) => {
  const chartData = data.map((flow) => ({
    hour: flow.hour,
    electricity: Math.max(0, flow.electricityDemandKwh - flow.heatPumpDemandKwh - flow.evChargeKwh),
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
      <YAxis unit=" kWh" tickFormatter={(value) => formatCalculatedValue(Number(value))} />
      <Tooltip formatter={(value) => `${formatCalculatedValue(Number(value))} kWh`} />
      <TariffWindow
        startHour={DEFAULT_ELECTRICITY_TARIFF.nightStartHour}
        endHour={DEFAULT_ELECTRICITY_TARIFF.nightEndHour}
        fill="var(--chart-cheap-window)"
        fillOpacity={0.16}
        label="Cheap hours"
        labelFill="var(--question)"
      />
      <TariffWindow
        startHour={DEFAULT_ELECTRICITY_TARIFF.peakExportStartHour}
        endHour={DEFAULT_ELECTRICITY_TARIFF.peakExportEndHour}
        fill="var(--chart-peak-window)"
        fillOpacity={0.13}
        label="Peak hours"
        labelFill="var(--chart-peak-window)"
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
