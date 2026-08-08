import {type HourlyEnergyFlow} from "../simulation.ts";
import type {
    BillEstimate,
    PeriodBill
} from "@/features/household-energy-comparison/models/billing.ts";
import {
    DAYS_PER_YEAR,
    DEFAULT_ELECTRICITY_TARIFF, MONTHS_PER_YEAR
} from "@/features/household-energy-comparison/calculations/billing/config.ts";

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


