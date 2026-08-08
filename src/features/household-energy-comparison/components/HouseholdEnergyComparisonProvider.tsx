import {useState, type ReactNode} from "react";
import {HouseholdEnergyComparisonContext} from "features/household-energy-comparison/context";
import {
    type HouseholdAssessment,
    type HouseholdFormDraft,
    initialValues,
    toHouseholdAssessment,
} from "features/household-energy-comparison/models/schema";

export const HouseholdEnergyComparisonProvider = ({children}: {children: ReactNode}) => {
    const [draft, setDraft] = useState<HouseholdFormDraft>(initialValues);
    const [assessment, setAssessment] = useState<HouseholdAssessment | null>(null);

    const submitDraft = (submittedDraft: HouseholdFormDraft) => {
        setDraft(submittedDraft);
        setAssessment(toHouseholdAssessment(submittedDraft));
    };

    return (
        <HouseholdEnergyComparisonContext value={{draft, assessment, submitDraft}}>
            {children}
        </HouseholdEnergyComparisonContext>
    );
};
