import {describe, expect, it} from "vitest";
import {calculateBill} from "features/household-energy-comparison/calculations/billing/calculateBill";
import {DEFAULT_ELECTRICITY_TARIFF} from "features/household-energy-comparison/calculations/billing/config";
import {flow} from "testing/householdEnergyComparison";

describe("electricity billing", () => {
    it("applies night, day, standing, and export rates", () => {
        const estimate = calculateBill([flow(2, 2, 0.5), flow(12, 3, 1)]);
        const expectedSupplierBill =
            2 * DEFAULT_ELECTRICITY_TARIFF.nightImportGbpPerKwh +
            3 * DEFAULT_ELECTRICITY_TARIFF.dayImportGbpPerKwh +
            DEFAULT_ELECTRICITY_TARIFF.standingChargeGbpPerDay;
        const expectedExport = 1.5 * DEFAULT_ELECTRICITY_TARIFF.exportGbpPerKwh;

        expect(estimate.daily.supplierBill).toBeCloseTo(expectedSupplierBill);
        expect(estimate.daily.exportEarnings).toBeCloseTo(expectedExport);
        expect(estimate.daily.netCost).toBeCloseTo(expectedSupplierBill - expectedExport);
        expect(estimate.annual.netCost).toBeCloseTo(estimate.daily.netCost * 365);
        expect(estimate.monthly.netCost).toBeCloseTo(estimate.annual.netCost / 12);
    });

    it("retains a negative net cost as credit", () => {
        const estimate = calculateBill([flow(12, 0, 100)]);

        expect(estimate.daily.netCost).toBeLessThan(0);
    });
});
