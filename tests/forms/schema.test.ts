import {describe, expect, it} from "vitest";
import {
    getBatteryCapacityKwh,
    getSolarCapacityKw,
    PROPOSED_SOLAR_PANEL_CAPACITY_KW,
    toHouseholdAssessment,
    type HouseholdFormDraft,
} from "../../src/forms/householdSetup/schema";
import {buildHouseholdScenarios} from "../../src/forms/householdSetup/householdScenarios";

const draft = (overrides: Partial<HouseholdFormDraft> = {}): HouseholdFormDraft => ({
    hasSolar: true,
    hasBatteries: true,
    hasElectricVehicle: false,
    monthlyElectricityCost: 120,
    heatPump: {capacityKw: 8},
    solar: {panelCount: 10, panelCapacityKw: 0.4},
    battery: {unitCount: 1, unitCapacityKwh: 13.5},
    electricVehicle: {},
    ...overrides,
});

describe("equipment capacity", () => {
    it("uses a realistic 0.4 kW capacity for each proposed panel", () => {
        expect(PROPOSED_SOLAR_PANEL_CAPACITY_KW).toBe(0.4);
    });

    it("derives solar capacity from panel count and capacity", () => {
        expect(getSolarCapacityKw({panelCount: 10, panelCapacityKw: 0.4})).toBe(4);
    });

    it("derives battery capacity from unit count and capacity", () => {
        expect(getBatteryCapacityKwh({unitCount: 2, unitCapacityKwh: 6.5})).toBe(13);
    });
});

describe("form-to-domain mapping", () => {
    it("maps installed equipment into current assets", () => {
        const assessment = toHouseholdAssessment(draft());

        expect(assessment.current.solar).toEqual({panelCount: 10, panelCapacityKw: 0.4});
        expect(assessment.current.battery).toEqual({unitCount: 1, unitCapacityKwh: 13.5});
        expect(assessment.proposed).toEqual({solar: undefined, battery: undefined});
    });

    it("maps absent equipment into proposed assets", () => {
        const assessment = toHouseholdAssessment(draft({
            hasSolar: false,
            hasBatteries: false,
            solar: {panelCount: 8},
            battery: {unitCount: 2, unitCapacityKwh: 7},
        }));

        expect(assessment.current).toEqual({solar: undefined, battery: undefined});
        expect(assessment.proposed.solar).toEqual({
            panelCount: 8,
            panelCapacityKw: PROPOSED_SOLAR_PANEL_CAPACITY_KW,
        });
        expect(assessment.proposed.battery).toEqual({unitCount: 2, unitCapacityKwh: 7});
    });

    it("does not require hidden EV fields when there is no EV", () => {
        expect(() => toHouseholdAssessment(draft({hasElectricVehicle: false, electricVehicle: {}}))).not.toThrow();
    });
});

describe("scenario composition", () => {
    it("creates current, individual proposal, and combined scenarios", () => {
        const assessment = toHouseholdAssessment(draft({
            hasSolar: false,
            hasBatteries: false,
            solar: {panelCount: 8},
            battery: {unitCount: 2, unitCapacityKwh: 7},
        }));
        const scenarios = buildHouseholdScenarios(assessment);

        expect(scenarios.map(({id}) => id)).toEqual(["current", "solar", "battery", "solar-battery"]);
        expect(scenarios[0].assets).toEqual({solar: undefined, battery: undefined});
        expect(scenarios[1].assets).toEqual({solar: assessment.proposed.solar, battery: undefined});
        expect(scenarios[2].assets).toEqual({solar: undefined, battery: assessment.proposed.battery});
        expect(scenarios[3].assets).toEqual(assessment.proposed);
    });

    it("preserves installed assets when adding a proposal", () => {
        const assessment = toHouseholdAssessment(draft({
            hasSolar: true,
            hasBatteries: false,
            battery: {unitCount: 2, unitCapacityKwh: 7},
        }));
        const batteryScenario = buildHouseholdScenarios(assessment).find(({id}) => id === "battery");

        expect(batteryScenario?.assets.solar).toEqual(assessment.current.solar);
        expect(batteryScenario?.assets.battery).toEqual(assessment.proposed.battery);
    });

    it("does not create redundant proposals for installed equipment", () => {
        expect(buildHouseholdScenarios(toHouseholdAssessment(draft())).map(({id}) => id)).toEqual(["current"]);
    });
});
