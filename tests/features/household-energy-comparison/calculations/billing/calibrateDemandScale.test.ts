import {describe, expect, it} from "vitest";
import {scenario} from "testing/householdEnergyComparison";
import {
    simulateDailyEnergy
} from "features/household-energy-comparison/calculations/simulation/simulation";
import {
    calibrateDemandScale
} from "features/household-energy-comparison/calculations/billing/calibrateDemandScale";
import {
    calculateBill
} from "features/household-energy-comparison/calculations/billing/calculateBill";

describe("demand calibration", () => {
    it("reproduces the entered current supplier bill within one penny", () => {
        const current = scenario();
        const calibration = calibrateDemandScale(current, 120);

        expect(typeof calibration).toBe("number");
        if (typeof calibration !== "number") return;
        const calibratedBill = calculateBill(simulateDailyEnergy(current, {demandScale: calibration}));
        expect(calibratedBill.monthly.supplierBill).toBeCloseTo(120, 2);
    });

    it("matches supplier charges without subtracting export earnings", () => {
        const current = scenario({assets: {solar: {panelCount: 10, panelCapacityKw: 0.4}}});
        const calibration = calibrateDemandScale(current, 120);

        expect(typeof calibration).toBe("number");
        if (typeof calibration !== "number") return;
        const calibratedBill = calculateBill(simulateDailyEnergy(current, {demandScale: calibration}));
        expect(calibratedBill.monthly.supplierBill).toBeCloseTo(120, 2);
        expect(calibratedBill.monthly.netCost).toBeLessThan(calibratedBill.monthly.supplierBill);
    });

    it("returns an explicit error for a bill below the modeled minimum", () => {
        const calibration = calibrateDemandScale(scenario(), 1);

        expect(calibration).toMatchObject({kind: "calibration-error"});
    });

    it("returns an explicit error for a bill above the modeled maximum", () => {
        const calibration = calibrateDemandScale(scenario(), 1_000_000);

        expect(calibration).toMatchObject({
            kind: "calibration-error",
            maximumMonthlySupplierBill: expect.any(Number),
        });
        if (typeof calibration === "number") return;
        expect(calibration.maximumMonthlySupplierBill).toBeLessThan(1_000_000);
        expect(calibration.message).toContain("above the modeled maximum");
    });

    it.each([
        {battery: {unitCount: 1, unitCapacityKwh: 13.5}},
        {solar: {panelCount: 10, panelCapacityKw: 0.4}, battery: {unitCount: 1, unitCapacityKwh: 13.5}},
    ])("calibrates households with existing assets", (assets) => {
        const current = scenario({assets});
        const calibration = calibrateDemandScale(current, 120);

        expect(typeof calibration).toBe("number");
        if (typeof calibration !== "number") return;
        expect(calculateBill(simulateDailyEnergy(current, {demandScale: calibration})).monthly.supplierBill)
            .toBeCloseTo(120, 2);
    });
});
