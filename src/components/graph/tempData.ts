import type {Household} from "@/forms/householdSetup/schema";

export type GraphData = {
    hour: number;
    gas: number;
    solar: number;
    battery: number;
    electricity: number;
    evCharging: number;
};

const REFERENCE_SOLAR_KW = 4.8;
const REFERENCE_BATTERY_KWH = 13.5;
const REFERENCE_HEAT_PUMP_KW = 8;
const REFERENCE_EV_CAPACITY_KWH = 50;
const REFERENCE_EV_CHARGES_PER_WEEK = 2;

const GENERAL_ELECTRICITY = [
    160, 140, 130, 130, 140, 180, 420, 520, 380, 250, 220, 230,
    300, 280, 230, 240, 300, 520, 680, 720, 560, 380, 240, 180,
];

const COOKING_GAS = [
    0, 0, 0, 0, 0, 0, 80, 240, 120, 0, 0, 40,
    120, 40, 0, 0, 0, 100, 420, 560, 260, 80, 0, 0,
];

const GAS_HEATING = [
    300, 280, 260, 250, 280, 450, 1100, 1450, 900, 420, 260, 200,
    180, 180, 200, 240, 380, 800, 1400, 1700, 1450, 950, 600, 400,
];

const HEAT_PUMP_ELECTRICITY = [
    220, 200, 190, 180, 200, 300, 620, 760, 520, 300, 220, 180,
    170, 170, 180, 220, 300, 520, 760, 880, 720, 500, 340, 260,
];

// Generation and discharging are negative; charging and demand are positive.
const SOLAR_GENERATION = [
    0, 0, 0, 0, 0, 0, 0, 0, -120, -360, -620, -850,
    -980, -900, -700, -460, -220, -60, 0, 0, 0, 0, 0, 0,
];

const BATTERY_FLOW = [
    -80, -70, -60, -50, -40, -70, -180, -220, -100, 120, 280, 400,
    450, 420, 300, 120, -40, -220, -360, -420, -360, -260, -160, -100,
];

// A 50 kWh EV charged twice weekly averages roughly 14.3 kWh per day.
const EV_CHARGING = [
    3570, 3570, 3570, 3570, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const scale = (value: number, ratio: number) => Math.round(value * ratio);

export const estimateDailyUsage = (household: Household): GraphData[] => {
    const solarRatio = household.hasSolar
        ? (household.solar.valueOfTotalOutput ?? 0) / REFERENCE_SOLAR_KW
        : 0;
    const batteryRatio = household.hasBatteries
        ? (household.battery.totalStorage ?? 0) / REFERENCE_BATTERY_KWH
        : 0;
    const heatPumpRatio = household.hasHeatPump
        ? (household.heatPump.capacityKw ?? 0) / REFERENCE_HEAT_PUMP_KW
        : 0;
    const evRatio = household.hasElectricVehicle
        ? ((household.electricVehicle.batteryCapacity ?? 0) *
            (household.electricVehicle.numberOfTotalChargesPerWeek ?? 0)) /
        (REFERENCE_EV_CAPACITY_KWH * REFERENCE_EV_CHARGES_PER_WEEK)
        : 0;

    return GENERAL_ELECTRICITY.map((generalElectricity, hour) => ({
        hour,
        gas: household.hasGas
            ? COOKING_GAS[hour] + (household.hasGasHeating ? GAS_HEATING[hour] : 0)
            : 0,
        solar: scale(SOLAR_GENERATION[hour], solarRatio),
        battery: scale(BATTERY_FLOW[hour], batteryRatio),
        electricity: generalElectricity + scale(HEAT_PUMP_ELECTRICITY[hour], heatPumpRatio),
        evCharging: scale(EV_CHARGING[hour], evRatio),
    }));
};
