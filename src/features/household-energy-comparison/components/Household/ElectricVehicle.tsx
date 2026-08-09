import { NumberField } from './Number'
import type { HouseholdFormDraft } from 'features/household-energy-comparison/models/schema'
import { BooleanField } from './Boolean'
import { DetailCard } from './HouseholdDetail'

export const ElectricVehicle = (props: { values: HouseholdFormDraft }) => (
  <>
    <BooleanField name="hasElectricVehicle" label="Does the household have an electric vehicle?" />
    {props.values.hasElectricVehicle ? (
      <DetailCard title="Electric vehicle">
        <NumberField
          name="electricVehicle.batteryCapacityKwh"
          label="Battery capacity"
          unit="kWh"
        />
        <NumberField
          name="electricVehicle.chargesPerWeek"
          label="Full battery-equivalent charges per week"
          description="You can enter a fraction to represent partial charging, for example 0.5."
        />
        <BooleanField
          name="electricVehicle.canSupplyGrid"
          label="Can it supply electricity back to the grid?"
        />
      </DetailCard>
    ) : null}
  </>
)
