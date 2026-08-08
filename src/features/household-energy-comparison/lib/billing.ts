import {simulateDailyEnergy, type HourlyEnergyFlow} from "./simulation";
import type {HouseholdScenario} from "../model/householdScenarios";

export type ElectricityTariff = {
    nightImportGbpPerKwh: number;
    dayImportGbpPerKwh: number;
    exportGbpPerKwh: number;
    standingChargeGbpPerDay: number;
    nightStartHour: number;
    nightEndHour: number;
    effectivePeriod: string;
};

export type PeriodBill = {
    supplierBill: number;
    exportEarnings: number;
    netCost: number;
};

export type BillEstimate = {
    daily: PeriodBill;
    monthly: PeriodBill;
    annual: PeriodBill;
};

export type ScenarioFinancialResult = {
    scenario: HouseholdScenario;
    energyFlows: HourlyEnergyFlow[];
    bill: BillEstimate;
    monthlySavings: number;
    annualSavings: number;
};

export type FinancialComparison = {
    demandScale: number;
    inferredDailyDemandKwh: number;
    inferredAnnualDemandKwh: number;
    results: ScenarioFinancialResult[];
};

export type CalibrationError = {
    kind: "calibration-error";
    message: string;
    minimumMonthlySupplierBill: number;
    maximumMonthlySupplierBill?: number;
};

export const DEFAULT_ELECTRICITY_TARIFF: ElectricityTariff = {
    nightImportGbpPerKwh: 0.1453,
    dayImportGbpPerKwh: 0.3161,
    exportGbpPerKwh: 0.1286,
    standingChargeGbpPerDay: 0.5695,
    nightStartHour: 0,
    nightEndHour: 7,
    effectivePeriod: "1 July to 30 September 2026",
};

const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;
const CALIBRATION_TOLERANCE_GBP = 0.0001;
const CALIBRATION_ITERATIONS = 60;
const MAX_DEMAND_SCALE = 1024;

export const getImportRate = (hour: number, tariff = DEFAULT_ELECTRICITY_TARIFF): number =>
    hour >= tariff.nightStartHour && hour < tariff.nightEndHour
        ? tariff.nightImportGbpPerKwh
        : tariff.dayImportGbpPerKwh;

const scalePeriodBill = (bill: PeriodBill, factor: number): PeriodBill => ({
    supplierBill: bill.supplierBill * factor,
    exportEarnings: bill.exportEarnings * factor,
    netCost: bill.netCost * factor,
});

export const calculateBill = (
    energyFlows: HourlyEnergyFlow[],
    tariff = DEFAULT_ELECTRICITY_TARIFF,
): BillEstimate => {
    const importCost = energyFlows.reduce(
        (total, flow) => total + flow.gridImportKwh * getImportRate(flow.hour, tariff),
        0,
    );
    const exportEarnings = energyFlows.reduce(
        (total, flow) => total + flow.gridExportKwh * tariff.exportGbpPerKwh,
        0,
    );
    const daily: PeriodBill = {
        supplierBill: importCost + tariff.standingChargeGbpPerDay,
        exportEarnings,
        netCost: importCost + tariff.standingChargeGbpPerDay - exportEarnings,
    };

    return {
        daily,
        monthly: scalePeriodBill(daily, DAYS_PER_YEAR / MONTHS_PER_YEAR),
        annual: scalePeriodBill(daily, DAYS_PER_YEAR),
    };
};

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

export const buildFinancialComparison = (
    scenarios: HouseholdScenario[],
    targetMonthlySupplierBill: number,
    tariff = DEFAULT_ELECTRICITY_TARIFF,
): FinancialComparison | CalibrationError => {
    const currentScenario = scenarios[0];
    const calibration = calibrateDemandScale(currentScenario, targetMonthlySupplierBill, tariff);
    if (typeof calibration !== "number") return calibration;

    const priced = scenarios.map((scenario) => {
        const energyFlows = simulateDailyEnergy(scenario, {demandScale: calibration});
        return {scenario, energyFlows, bill: calculateBill(energyFlows, tariff)};
    });
    const currentNetMonthly = priced[0].bill.monthly.netCost;
    const currentNetAnnual = priced[0].bill.annual.netCost;
    const inferredDailyDemandKwh = priced[0].energyFlows.reduce(
        (total, flow) => total + flow.electricityDemandKwh,
        0,
    );

    return {
        demandScale: calibration,
        inferredDailyDemandKwh,
        inferredAnnualDemandKwh: inferredDailyDemandKwh * DAYS_PER_YEAR,
        results: priced.map((result) => ({
            ...result,
            monthlySavings: currentNetMonthly - result.bill.monthly.netCost,
            annualSavings: currentNetAnnual - result.bill.annual.netCost,
        })),
    };
};
