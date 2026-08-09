import { useNavigate } from 'react-router-dom'
import { useHouseholdEnergyComparison } from 'features/household-energy-comparison/context'
import { HouseholdSetupForm } from './HouseholdSetupForm'

export const HouseholdSetupPage = () => {
  const navigate = useNavigate()
  const { draft, submitDraft } = useHouseholdEnergyComparison()

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <main className="mx-auto w-full max-w-6xl">
        <HouseholdSetupForm
          initialValues={draft}
          onSubmit={(submittedDraft) => {
            submitDraft(submittedDraft)
            navigate('/results')
          }}
        />
      </main>
    </div>
  )
}
