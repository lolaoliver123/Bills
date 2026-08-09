import { type HouseholdFormDraft } from 'features/household-energy-comparison/models/formSchema'
import { DetailCard } from './HouseholdDetail'
import { NumberField } from './NumberField'
import { BooleanField } from './BooleanField'

export const HeatPump = (props: { values: HouseholdFormDraft }) => (
  <DetailCard title="Heat Pump">
    <NumberField name="heatPump.capacityKw" label="Heat pump capacity" unit="kW" />
    <NumberField
      name="heatPump.annualSpaceHeatingDemandKwh"
      label="Annual space-heating demand"
      unit="kWh"
      description="Use the space-heating figure from the property’s EPC where available."
    />
    <BooleanField
      name="heatPump.suppliesHotWater"
      label="Does the heat pump also supply hot water?"
    />
    {props.values.heatPump.suppliesHotWater ? (
      <NumberField
        name="heatPump.annualHotWaterDemandKwh"
        label="Annual hot-water demand"
        unit="kWh"
      />
    ) : null}
    <NumberField
      name="heatPump.scop"
      label="Heat pump seasonal efficiency (SCOP)"
      description="Defaults to the UK government modelling assumption of 2.8."
    />
  </DetailCard>
)
