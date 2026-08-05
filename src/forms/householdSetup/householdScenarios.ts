import {schema, withCalculatedFields, type Household} from "./schema";

const createScenario = (household: Household): Household => schema.parse(withCalculatedFields(household));

export const currentHousehold = createScenario({
    hasGas: true,
    hasGasHeating: false,
    hasSolar: false,
    hasHeatPump: true,
    hasBatteries: false,
    hasElectricVehicle: false,
    gasCost: 20,
    electricCost: 180,
    solar: {},
    battery: {},
    heatPump: {capacityKw: 8},
    electricVehicle: {},
});

export const idealHousehold = createScenario({
    hasGas: false,
    hasGasHeating: false,
    hasSolar: true,
    hasHeatPump: true,
    hasBatteries: true,
    hasElectricVehicle: false,
    gasCost: undefined,
    electricCost: 160,
    solar: {
        averageIndividualPanelOutput: 0.4,
        numberOfPanels: 12,
    },
    battery: {
        averageBatteryCapacity: 13.5,
        numberOfBatteries: 1,
    },
    heatPump: {capacityKw: 8},
    electricVehicle: {},
});
