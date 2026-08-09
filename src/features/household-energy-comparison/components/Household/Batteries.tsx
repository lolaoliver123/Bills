import {
  type BatterySystem,
  getBatteryCapacityKwh,
  type HouseholdFormDraft,
} from 'features/household-energy-comparison/models/schema'
import { BooleanField } from './Boolean'
import { NumberField } from './Number'
import { DetailCard } from './HouseholdDetail'
import { CalculatedField } from './Calculated'

const batteryCapacity = (values: HouseholdFormDraft): number | undefined => {
  if (values.battery.unitCount === undefined || values.battery.unitCapacityKwh === undefined)
    return undefined
  return getBatteryCapacityKwh({
    unitCount: values.battery.unitCount,
    unitCapacityKwh: values.battery.unitCapacityKwh,
  } satisfies BatterySystem)
}

export const Batteries = (props: { values: HouseholdFormDraft }) => (
  <>
    <BooleanField name="hasBatteries" label="Does the household have batteries?" />
    {props.values.hasBatteries !== undefined ? (
      <DetailCard
        title={
          props.values.hasBatteries ? 'Installed battery storage' : 'Proposed battery storage'
        }
      >
        <NumberField name="battery.unitCapacityKwh" label="Average battery capacity" unit="kWh" />
        <NumberField name="battery.unitCount" label="Number of batteries" />
        <CalculatedField
          label="Total storage capacity"
          value={batteryCapacity(props.values)}
          unit="kWh"
        />
      </DetailCard>
    ) : null}
  </>
)
