import { BooleanField } from './Boolean'
import {
  getSolarCapacityKw,
  type HouseholdFormDraft,
  PROPOSED_SOLAR_PANEL_CAPACITY_KW,
  type SolarSystem,
} from 'features/household-energy-comparison/models/schema'
import { DetailCard } from './HouseholdDetail'
import { NumberField } from './Number'
import { CalculatedField } from './Calculated'

const solarCapacity = (values: HouseholdFormDraft): number | undefined => {
  if (values.hasSolar === undefined || values.solar.panelCount === undefined) return undefined
  const panelCapacityKw = values.hasSolar
    ? values.solar.panelCapacityKw
    : PROPOSED_SOLAR_PANEL_CAPACITY_KW
  if (panelCapacityKw === undefined) return undefined
  return getSolarCapacityKw({
    panelCount: values.solar.panelCount,
    panelCapacityKw,
  } satisfies SolarSystem)
}

export const Solar = (props: { values: HouseholdFormDraft }) => (
  <>
    <BooleanField name="hasSolar" label="Does the household have solar panels?" />
    {props.values.hasSolar !== undefined ? (
      <DetailCard
        title={props.values.hasSolar ? 'Installed solar panels' : 'Proposed solar panels'}
      >
        {props.values.hasSolar ? (
          <NumberField
            name="solar.panelCapacityKw"
            label="Average individual panel output"
            unit="kW"
          />
        ) : (
          <CalculatedField
            label="Assumed output per panel"
            value={PROPOSED_SOLAR_PANEL_CAPACITY_KW}
            unit="kW"
          />
        )}
        <NumberField name="solar.panelCount" label="Number of panels" />
        <CalculatedField
          label="Total solar capacity"
          value={solarCapacity(props.values)}
          unit="kW"
        />
      </DetailCard>
    ) : null}
  </>
)
