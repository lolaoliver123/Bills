import * as z from "zod";

export type SolarSystem = {
    panelCount: number;
    panelCapacityKw: number;
};

export type BatterySystem = {
    unitCount: number;
    unitCapacityKwh: number;
};

export type HeatPump = {
    capacityKw: number;
};

export type ElectricVehicle = {
    batteryCapacityKwh: number;
    chargesPerWeek: number;
    canSupplyGrid: boolean;
};

export type EnergyAssets = {
    solar?: SolarSystem;
    battery?: BatterySystem;
};

export type HouseholdProfile = {
    heatPump: HeatPump;
    electricVehicle?: ElectricVehicle;
    monthlyElectricityCost: number;
};

export type HouseholdAssessment = {
    household: HouseholdProfile;
    current: EnergyAssets;
    proposed: EnergyAssets;
};

export const PROPOSED_SOLAR_PANEL_CAPACITY_KW = 0.4;

const optionalNumber = z.number().optional();

const required = (ctx: z.RefinementCtx, path: (string | number)[], message = "This field is required") => {
    ctx.addIssue({code: "custom", path, message});
};

const requirePositive = (ctx: z.RefinementCtx, value: number | undefined, path: (string | number)[]) => {
    if (value === undefined) required(ctx, path);
    else if (value <= 0) ctx.addIssue({code: "custom", path, message: "Must be greater than 0"});
};

const requirePositiveInteger = (ctx: z.RefinementCtx, value: number | undefined, path: (string | number)[]) => {
    requirePositive(ctx, value, path);
    if (value !== undefined && !Number.isInteger(value)) {
        ctx.addIssue({code: "custom", path, message: "Must be a whole number"});
    }
};

export const householdFormSchema = z.object({
    hasSolar: z.boolean().optional(),
    hasBatteries: z.boolean().optional(),
    hasElectricVehicle: z.boolean().optional(),
    monthlyElectricityCost: optionalNumber,
    heatPump: z.object({capacityKw: optionalNumber}),
    solar: z.object({panelCount: optionalNumber, panelCapacityKw: optionalNumber}),
    battery: z.object({unitCount: optionalNumber, unitCapacityKwh: optionalNumber}),
    electricVehicle: z.object({
        batteryCapacityKwh: optionalNumber,
        chargesPerWeek: optionalNumber,
        canSupplyGrid: z.boolean().optional(),
    }),
}).superRefine((data, ctx) => {
    (["hasSolar", "hasBatteries", "hasElectricVehicle"] as const).forEach((field) => {
        if (data[field] === undefined) required(ctx, [field], "Please choose yes or no");
    });

    requirePositive(ctx, data.monthlyElectricityCost, ["monthlyElectricityCost"]);
    requirePositive(ctx, data.heatPump.capacityKw, ["heatPump", "capacityKw"]);

    if (data.hasSolar !== undefined) {
        requirePositiveInteger(ctx, data.solar.panelCount, ["solar", "panelCount"]);
        if (data.hasSolar) requirePositive(ctx, data.solar.panelCapacityKw, ["solar", "panelCapacityKw"]);
    }

    if (data.hasBatteries !== undefined) {
        requirePositiveInteger(ctx, data.battery.unitCount, ["battery", "unitCount"]);
        requirePositive(ctx, data.battery.unitCapacityKwh, ["battery", "unitCapacityKwh"]);
    }

    if (data.hasElectricVehicle) {
        requirePositive(ctx, data.electricVehicle.batteryCapacityKwh, ["electricVehicle", "batteryCapacityKwh"]);
        requirePositive(ctx, data.electricVehicle.chargesPerWeek, ["electricVehicle", "chargesPerWeek"]);
        if (data.electricVehicle.canSupplyGrid === undefined) {
            required(ctx, ["electricVehicle", "canSupplyGrid"], "Please choose yes or no");
        }
    }
});

export type HouseholdFormDraft = z.infer<typeof householdFormSchema>;

export const initialValues: HouseholdFormDraft = {
    hasSolar: undefined,
    hasBatteries: undefined,
    hasElectricVehicle: undefined,
    monthlyElectricityCost: undefined,
    heatPump: {capacityKw: undefined},
    solar: {panelCount: undefined, panelCapacityKw: undefined},
    battery: {unitCount: undefined, unitCapacityKwh: undefined},
    electricVehicle: {
        batteryCapacityKwh: undefined,
        chargesPerWeek: undefined,
        canSupplyGrid: undefined,
    },
};

export const getSolarCapacityKw = (system: SolarSystem): number =>
    system.panelCount * system.panelCapacityKw;

export const getBatteryCapacityKwh = (system: BatterySystem): number =>
    system.unitCount * system.unitCapacityKwh;

export const toHouseholdAssessment = (draft: HouseholdFormDraft): HouseholdAssessment => {
    const parsed = householdFormSchema.parse(draft);
    const solar: SolarSystem = {
        panelCount: parsed.solar.panelCount!,
        panelCapacityKw: parsed.hasSolar
            ? parsed.solar.panelCapacityKw!
            : PROPOSED_SOLAR_PANEL_CAPACITY_KW,
    };
    const battery: BatterySystem = {
        unitCount: parsed.battery.unitCount!,
        unitCapacityKwh: parsed.battery.unitCapacityKwh!,
    };

    return {
        household: {
            heatPump: {capacityKw: parsed.heatPump.capacityKw!},
            monthlyElectricityCost: parsed.monthlyElectricityCost!,
            electricVehicle: parsed.hasElectricVehicle ? {
                batteryCapacityKwh: parsed.electricVehicle.batteryCapacityKwh!,
                chargesPerWeek: parsed.electricVehicle.chargesPerWeek!,
                canSupplyGrid: parsed.electricVehicle.canSupplyGrid!,
            } : undefined,
        },
        current: {
            solar: parsed.hasSolar ? solar : undefined,
            battery: parsed.hasBatteries ? battery : undefined,
        },
        proposed: {
            solar: parsed.hasSolar === false ? solar : undefined,
            battery: parsed.hasBatteries === false ? battery : undefined,
        },
    };
};
