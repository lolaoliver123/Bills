import type {Household} from "./schema";

export const withPotentialSolar = (household: Household): Household => ({
    ...household,
    hasSolar: true,
    solar: {...household.potentialSolar},
});
