import { useFormikContext } from 'formik'
import {
  type HouseholdFormDraft,
  MAX_MONTHLY_ELECTRICITY_COST_GBP,
} from 'features/household-energy-comparison/models/formSchema'
import { NumberField } from './NumberField'
import { HeatPump } from './HeatPump'
import { Solar } from './Solar'
import { Batteries } from './Batteries'
import { ElectricVehicle } from './ElectricVehicle'

export const HouseholdFields = () => {
  const { values } = useFormikContext<HouseholdFormDraft>()

  return (
    <div className="grid gap-6">
      <HeatPump values={values} />
      <Solar values={values} />
      <Batteries values={values} />
      <ElectricVehicle values={values} />
      <NumberField
        name="monthlyElectricityCost"
        label="Monthly electricity bill"
        unit="£"
        max={MAX_MONTHLY_ELECTRICITY_COST_GBP}
      />
    </div>
  )
}
