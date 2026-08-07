import type {Household} from "./schema";

export const withPotentialSolar = (household: Household): Household => ({
    ...household,
    hasSolar: true,
    solar: {...household.potentialSolar},
});

export const withPotentialBatteries = (household: Household): Household => ({
    ...household,
    hasBatteries: true,
    battery: {...household.potentialBattery}
})


export const withPotentialBatteriesAndSolar = (household: Household): Household => ({
    ...household,
    hasBatteries: true,
    battery: {...household.potentialBattery},
    hasSolar: true,
    solar: {...household.potentialSolar}
})