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
  hasGas?: boolean;
  hasGasHeating?: boolean;
  hasSolar?: boolean;
  hasHeatPump?: boolean;
  hasBatteries?: boolean;
  hasElectricVehicle?: boolean;
  gasCost?: number;
  electricCost?: number;
  solar: Solar;
  battery: Battery;
  heatPump: HeatPump;
  electricVehicle: ElectricVehicle;
};

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

function required(ctx: z.RefinementCtx, path: (string | number)[], message = "This field is required") {
  ctx.addIssue({ code: "custom", path, message });
}

function requirePositive(ctx: z.RefinementCtx, value: number | undefined, path: (string | number)[]) {
  if (value === undefined) required(ctx, path);
  else if (value <= 0) ctx.addIssue({ code: "custom", path, message: "Must be greater than 0" });
}

function requirePositiveInteger(ctx: z.RefinementCtx, value: number | undefined, path: (string | number)[]) {
  requirePositive(ctx, value, path);
  if (value !== undefined && !Number.isInteger(value)) {
    ctx.addIssue({ code: "custom", path, message: "Must be a whole number" });
  }
}

export const schema = z
  .object({
    hasGas: z.boolean().optional(),
    hasGasHeating: z.boolean().optional(),
    hasSolar: z.boolean().optional(),
    hasHeatPump: z.boolean().optional(),
    hasBatteries: z.boolean().optional(),
    hasElectricVehicle: z.boolean().optional(),
    gasCost: optionalNumber,
    electricCost: optionalNumber,
    solar: solarSchema,
    battery: batterySchema,
    heatPump: heatPumpSchema,
    electricVehicle: electricVehicleSchema,
  })
  .superRefine((data, ctx) => {
    (["hasGas", "hasSolar", "hasBatteries", "hasElectricVehicle"] as const).forEach((field) => {
      if (data[field] === undefined) required(ctx, [field], "Please choose yes or no");
    });

    if (data.hasGas) {
      if (data.hasGasHeating === undefined) required(ctx, ["hasGasHeating"], "Please choose yes or no");
      requirePositive(ctx, data.gasCost, ["gasCost"]);
    }

    const hasGasHeating = data.hasGas === true && data.hasGasHeating === true;
    if (!hasGasHeating && data.hasHeatPump === undefined) {
      required(ctx, ["hasHeatPump"], "Please choose yes or no");
    }

    requirePositive(ctx, data.electricCost, ["electricCost"]);

    if (data.hasSolar) {
      requirePositive(ctx, data.solar.averageIndividualPanelOutput, ["solar", "averageIndividualPanelOutput"]);
      requirePositiveInteger(ctx, data.solar.numberOfPanels, ["solar", "numberOfPanels"]);
    }

    if (data.hasBatteries) {
      requirePositive(ctx, data.battery.averageBatteryCapacity, ["battery", "averageBatteryCapacity"]);
      requirePositiveInteger(ctx, data.battery.numberOfBatteries, ["battery", "numberOfBatteries"]);
    }

    if (!hasGasHeating && data.hasHeatPump) requirePositive(ctx, data.heatPump.capacityKw, ["heatPump", "capacityKw"]);

    if (data.hasElectricVehicle) {
      requirePositive(ctx, data.electricVehicle.batteryCapacity, ["electricVehicle", "batteryCapacity"]);
      requirePositive(ctx, data.electricVehicle.numberOfTotalChargesPerWeek, ["electricVehicle", "numberOfTotalChargesPerWeek"]);
      if (data.electricVehicle.isVoltageToGrid === undefined) {
        required(ctx, ["electricVehicle", "isVoltageToGrid"], "Please choose yes or no");
      }
    }
  });

export const initialValues: Household = {
  hasGas: undefined,
  hasGasHeating: undefined,
  hasSolar: undefined,
  hasHeatPump: undefined,
  hasBatteries: undefined,
  hasElectricVehicle: undefined,
  gasCost: undefined,
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
  heatPump: { capacityKw: undefined },
  electricVehicle: {
    batteryCapacity: undefined,
    numberOfTotalChargesPerWeek: undefined,
    isVoltageToGrid: undefined,
  },
};

export function withCalculatedFields(values: Household): Household {
  const solarOutput =
    values.solar.averageIndividualPanelOutput !== undefined && values.solar.numberOfPanels !== undefined
      ? values.solar.averageIndividualPanelOutput * values.solar.numberOfPanels
      : undefined;
  const totalStorage =
    values.battery.averageBatteryCapacity !== undefined && values.battery.numberOfBatteries !== undefined
      ? values.battery.averageBatteryCapacity * values.battery.numberOfBatteries
      : undefined;

  return {
    ...values,
    solar: { ...values.solar, valueOfTotalOutput: solarOutput },
    battery: { ...values.battery, totalStorage },
  };
}
