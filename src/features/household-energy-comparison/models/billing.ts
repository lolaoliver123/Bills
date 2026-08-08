import type {HourlyEnergyFlow} from "features/household-energy-comparison/models/simulation.ts";
import type {HouseholdScenario} from "features/household-energy-comparison/models/householdScenarios.ts";

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
