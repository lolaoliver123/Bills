import type {HourlyEnergyFlow} from "features/household-energy-comparison/models/simulation";
import type {HouseholdScenario} from "features/household-energy-comparison/models/householdScenarios";

export const scenario = (overrides: Partial<HouseholdScenario> = {}): HouseholdScenario => ({
    id: "current",
    label: "Current household",
    description: "Test scenario",
    household: {heatPump: {capacityKw: 8}, monthlyElectricityCost: 120},
    assets: {},
    ...overrides,
});

export const flow = (hour: number, gridImportKwh: number, gridExportKwh: number): HourlyEnergyFlow => ({
    hour,
    electricityDemandKwh: 0,
    heatPumpDemandKwh: 0,
    solarGenerationKwh: 0,
    batteryChargeKwh: 0,
    batteryDischargeKwh: 0,
    gridImportKwh,
    gridExportKwh,
    batteryStateOfChargeKwh: 0,
});
