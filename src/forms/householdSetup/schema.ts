import * as z from "zod";

export type Solar = {
    averageIndividualPanelOutput?: number;
    numberOfPanels?: number;
    valueOfTotalOutput?: number;
};

export type Battery = {
    averageBatteryCapacity?: number;
    numberOfBatteries?: number;
    totalStorage?: number;
};

export type HeatPump = {
    capacityKw?: number;
};

export type ElectricVehicle = {
    batteryCapacity?: number;
    numberOfTotalChargesPerWeek?: number;
    isVoltageToGrid?: boolean;
};

export type Household = {
    hasSolar?: boolean;
    heatPump: HeatPump;
    hasBatteries?: boolean;
    hasElectricVehicle?: boolean;
    electricCost?: number;
    solar: Solar;
    potentialSolar: Solar;
    battery: Battery;
    potentialBattery: Battery;
    electricVehicle: ElectricVehicle;
};

export const POTENTIAL_SOLAR_PANEL_CAPACITY_KW = 123;

const optionalNumber = z.number().optional();

const solarSchema = z.object({
    averageIndividualPanelOutput: optionalNumber,
    numberOfPanels: optionalNumber,
    valueOfTotalOutput: optionalNumber,
});

const batterySchema = z.object({
    averageBatteryCapacity: optionalNumber,
    numberOfBatteries: optionalNumber,
    totalStorage: optionalNumber,
});

const heatPumpSchema = z.object({
    capacityKw: optionalNumber,
});

const electricVehicleSchema = z.object({
    batteryCapacity: optionalNumber,
    numberOfTotalChargesPerWeek: optionalNumber,
    isVoltageToGrid: z.boolean().optional(),
});

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

export const schema = z
    .object({
        hasSolar: z.boolean().optional(),
        hasBatteries: z.boolean().optional(),
        hasElectricVehicle: z.boolean().optional(),
        electricCost: optionalNumber,
        solar: solarSchema,
        potentialSolar: solarSchema,
        battery: batterySchema,
        heatPump: heatPumpSchema,
        electricVehicle: electricVehicleSchema,
    })
    .superRefine((data, ctx) => {
        (["hasSolar", "hasBatteries", "hasElectricVehicle"] as const).forEach((field) => {
            if (data[field] === undefined) required(ctx, [field], "Please choose yes or no");
        });

        requirePositive(ctx, data.electricCost, ["electricCost"]);

        if (data.hasSolar) {
            requirePositive(ctx, data.solar.averageIndividualPanelOutput, ["solar", "averageIndividualPanelOutput"]);
            requirePositiveInteger(ctx, data.solar.numberOfPanels, ["solar", "numberOfPanels"]);
        } else if (data.hasSolar === false) {
            requirePositiveInteger(ctx, data.potentialSolar.numberOfPanels, ["potentialSolar", "numberOfPanels"]);
        }

        if (data.hasBatteries) {
            requirePositive(ctx, data.battery.averageBatteryCapacity, ["battery", "averageBatteryCapacity"]);
            requirePositiveInteger(ctx, data.battery.numberOfBatteries, ["battery", "numberOfBatteries"]);
        }

        requirePositive(ctx, data.heatPump.capacityKw, ["heatPump", "capacityKw"]);

        if (data.hasElectricVehicle) {
            requirePositive(ctx, data.electricVehicle.batteryCapacity, ["electricVehicle", "batteryCapacity"]);
            requirePositive(ctx, data.electricVehicle.numberOfTotalChargesPerWeek, ["electricVehicle", "numberOfTotalChargesPerWeek"]);
            if (data.electricVehicle.isVoltageToGrid === undefined) {
                required(ctx, ["electricVehicle", "isVoltageToGrid"], "Please choose yes or no");
            }
        }
    });

export const initialValues: Household = {
    hasSolar: undefined,
    hasBatteries: undefined,
    hasElectricVehicle: undefined,
    electricCost: undefined,
    solar: {
        averageIndividualPanelOutput: undefined,
        numberOfPanels: undefined,
        valueOfTotalOutput: undefined,
    },
    battery: {
        averageBatteryCapacity: undefined,
        numberOfBatteries: undefined,
        totalStorage: undefined,
    },
    potentialSolar: {
        averageIndividualPanelOutput: undefined,
        numberOfPanels: undefined,
        valueOfTotalOutput: undefined,
    },
    potentialBattery: {
        averageBatteryCapacity: undefined,
        numberOfBatteries: undefined,
        totalStorage: undefined,
    },
    heatPump: {capacityKw: undefined},
    electricVehicle: {
        batteryCapacity: undefined,
        numberOfTotalChargesPerWeek: undefined,
        isVoltageToGrid: undefined,
    },
};

export const withCalculatedFields = (values: Household): Household => {
    const solarOutput =
        values.solar?.averageIndividualPanelOutput !== undefined && values.solar?.numberOfPanels !== undefined
            ? values.solar.averageIndividualPanelOutput * values.solar.numberOfPanels
            : undefined;
    const potentialSolarOutput =
        values.hasSolar === false && values.potentialSolar.numberOfPanels !== undefined
            ? POTENTIAL_SOLAR_PANEL_CAPACITY_KW * values.potentialSolar.numberOfPanels
            : undefined;
    const totalStorage =
        values.battery?.averageBatteryCapacity !== undefined && values.battery?.numberOfBatteries !== undefined
            ? values.battery.averageBatteryCapacity * values.battery.numberOfBatteries
            : undefined;
    const potentialTotalStorage =
        values.potentialBattery?.averageBatteryCapacity !== undefined && values.potentialBattery?.numberOfBatteries !== undefined
            ? values.potentialBattery.averageBatteryCapacity * values.potentialBattery.numberOfBatteries
            : undefined;
    return {
        ...values,
        solar: {...values.solar, valueOfTotalOutput: solarOutput},
        potentialSolar: {
            ...values.potentialSolar,
            averageIndividualPanelOutput: values.hasSolar === false
                ? POTENTIAL_SOLAR_PANEL_CAPACITY_KW
                : values.potentialSolar.averageIndividualPanelOutput,
            valueOfTotalOutput: potentialSolarOutput,
        },
        battery: {...values.battery, totalStorage: totalStorage},
        potentialBattery: {...values.potentialBattery, totalStorage: potentialTotalStorage},
    };
};
