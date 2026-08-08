import type {ElectricityTariff} from "@/features/household-energy-comparison/models/billing.ts";

export const DEFAULT_ELECTRICITY_TARIFF: ElectricityTariff = {
    nightImportGbpPerKwh: 0.1453,
    dayImportGbpPerKwh: 0.3161,
    exportGbpPerKwh: 0.1286,
    standingChargeGbpPerDay: 0.5695,
    nightStartHour: 0,
    nightEndHour: 7,
    effectivePeriod: "1 July to 30 September 2026",
};

export const DAYS_PER_YEAR = 365;
export const MONTHS_PER_YEAR = 12;