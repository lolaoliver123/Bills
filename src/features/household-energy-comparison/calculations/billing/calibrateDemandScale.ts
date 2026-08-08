import type {HouseholdScenario} from "@/features/household-energy-comparison/models/householdScenarios.ts";
import {calculateBill} from "@/features/household-energy-comparison/calculations/billing/calculateBill.ts";
import type {CalibrationError, ElectricityTariff} from "@/features/household-energy-comparison/models/billing.ts";
import {simulateDailyEnergy} from "@/features/household-energy-comparison/calculations/simulation.ts";
import {DEFAULT_ELECTRICITY_TARIFF} from "@/features/household-energy-comparison/calculations/billing/config.ts";

const CALIBRATION_TOLERANCE_GBP = 0.0001;
const CALIBRATION_ITERATIONS = 60;
const MAX_DEMAND_SCALE = 1024;

const monthlySupplierBillAtScale = (
    scenario: HouseholdScenario,
    demandScale: number,
    tariff: ElectricityTariff,
): number => calculateBill(simulateDailyEnergy(scenario, {demandScale}), tariff).monthly.supplierBill;


export const calibrateDemandScale = (
    currentScenario: HouseholdScenario,
    targetMonthlySupplierBill: number,
    tariff = DEFAULT_ELECTRICITY_TARIFF,
): number | CalibrationError => {
    const minimumMonthlySupplierBill = monthlySupplierBillAtScale(currentScenario, 0, tariff);
    if (targetMonthlySupplierBill < minimumMonthlySupplierBill - CALIBRATION_TOLERANCE_GBP) {
        return {
            kind: "calibration-error",
            message: `The entered bill is below the modeled minimum of £${minimumMonthlySupplierBill.toFixed(2)} per month.`,
            minimumMonthlySupplierBill,
        };
    }

    let lowerScale = 0;
    let upperScale = 1;
    while (
        monthlySupplierBillAtScale(currentScenario, upperScale, tariff) < targetMonthlySupplierBill &&
        upperScale < MAX_DEMAND_SCALE
        ) {
        upperScale *= 2;
    }

    const maximumMonthlySupplierBill = monthlySupplierBillAtScale(currentScenario, upperScale, tariff);
    if (maximumMonthlySupplierBill < targetMonthlySupplierBill - CALIBRATION_TOLERANCE_GBP) {
        return {
            kind: "calibration-error",
            message: `The entered bill is above the modeled maximum of £${maximumMonthlySupplierBill.toFixed(2)} per month.`,
            minimumMonthlySupplierBill,
            maximumMonthlySupplierBill,
        };
    }

    for (let iteration = 0; iteration < CALIBRATION_ITERATIONS; iteration += 1) {
        const midpoint = (lowerScale + upperScale) / 2;
        const midpointBill = monthlySupplierBillAtScale(currentScenario, midpoint, tariff);
        if (Math.abs(midpointBill - targetMonthlySupplierBill) <= CALIBRATION_TOLERANCE_GBP) return midpoint;
        if (midpointBill < targetMonthlySupplierBill) lowerScale = midpoint;
        else upperScale = midpoint;
    }

    return (lowerScale + upperScale) / 2;
};

