import {describe, expect, it} from "vitest";
import {
    buildFinancialComparison,
    calculateBill,
    calibrateDemandScale,
    DEFAULT_ELECTRICITY_TARIFF,
} from "../../../../src/features/household-energy-comparison/calculations/billing";
import {simulateDailyEnergy, type HourlyEnergyFlow} from "../../../../src/features/household-energy-comparison/calculations/simulation";
import type {HouseholdScenario} from "../../../../src/features/household-energy-comparison/models/householdScenarios";

const scenario = (overrides: Partial<HouseholdScenario> = {}): HouseholdScenario => ({
    id: "current",
    label: "Current household",
    description: "Test scenario",
    household: {heatPump: {capacityKw: 8}, monthlyElectricityCost: 120},
    assets: {},
    ...overrides,
});

const flow = (hour: number, gridImportKwh: number, gridExportKwh: number): HourlyEnergyFlow => ({
    hour,
    electricityDemandKwh: 0,
    solarGenerationKwh: 0,
    batteryChargeKwh: 0,
    batteryDischargeKwh: 0,
    gridImportKwh,
    gridExportKwh,
    batteryStateOfChargeKwh: 0,
});

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

describe("scenario financial comparison", () => {
    it("uses one calibrated demand for every scenario and calculates savings", () => {
        const current = scenario();
        const solar = scenario({
            id: "solar",
            label: "With proposed solar",
            assets: {solar: {panelCount: 10, panelCapacityKw: 0.4}},
        });
        const comparison = buildFinancialComparison([current, solar], 120);

        expect("kind" in comparison).toBe(false);
        if ("kind" in comparison) return;
        const currentDemand = comparison.results[0].energyFlows.reduce(
            (total, item) => total + item.electricityDemandKwh,
            0,
        );
        const solarDemand = comparison.results[1].energyFlows.reduce(
            (total, item) => total + item.electricityDemandKwh,
            0,
        );
        expect(solarDemand).toBeCloseTo(currentDemand);
        expect(comparison.results[0].monthlySavings).toBeCloseTo(0);
        expect(comparison.results[1].monthlySavings).toBeGreaterThan(0);
        expect(comparison.inferredAnnualDemandKwh).toBeCloseTo(comparison.inferredDailyDemandKwh * 365);
    });
});
