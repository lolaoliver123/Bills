import {getBatteryCapacityKwh, getSolarCapacityKw} from "@/forms/householdSetup/schema";
import type {HouseholdScenario} from "@/forms/householdSetup/householdScenarios";

export type GraphData = {
    hour: number;
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
const HEAT_PUMP_ELECTRICITY = [
    220, 200, 190, 180, 200, 300, 620, 760, 520, 300, 220, 180,
    170, 170, 180, 220, 300, 520, 760, 880, 720, 500, 340, 260,
];
const SOLAR_GENERATION = [
    0, 0, 0, 0, 0, 0, 0, 0, -120, -360, -620, -850,
    -980, -900, -700, -460, -220, -60, 0, 0, 0, 0, 0, 0,
];
const BATTERY_FLOW = [
    -80, -70, -60, -50, -40, -70, -180, -220, -100, 120, 280, 400,
    450, 420, 300, 120, -40, -220, -360, -420, -360, -260, -160, -100,
];
const EV_CHARGING = [
    3570, 3570, 3570, 3570, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const scale = (value: number, ratio: number) => Math.round(value * ratio);

export const estimateDailyUsage = ({household, assets}: HouseholdScenario): GraphData[] => {
    const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0;
    const batteryRatio = assets.battery ? getBatteryCapacityKwh(assets.battery) / REFERENCE_BATTERY_KWH : 0;
    const heatPumpRatio = household.heatPump.capacityKw / REFERENCE_HEAT_PUMP_KW;
    const evRatio = household.electricVehicle
        ? (household.electricVehicle.batteryCapacityKwh * household.electricVehicle.chargesPerWeek) /
          (REFERENCE_EV_CAPACITY_KWH * REFERENCE_EV_CHARGES_PER_WEEK)
        : 0;

    return GENERAL_ELECTRICITY.map((generalElectricity, hour) => ({
        hour,
        solar: scale(SOLAR_GENERATION[hour], solarRatio),
        battery: scale(BATTERY_FLOW[hour], batteryRatio),
        electricity: generalElectricity + scale(HEAT_PUMP_ELECTRICITY[hour], heatPumpRatio),
        evCharging: scale(EV_CHARGING[hour], evRatio),
    }));
};
