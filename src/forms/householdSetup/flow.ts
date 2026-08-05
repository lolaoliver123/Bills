import type { Household } from "./schema";

export type Question = {
  id: string;
  type: "boolean" | "number" | "solar" | "battery" | "heatPump" | "electricVehicle";
  visible?: (values: Household) => boolean;
};

export const questions: Question[] = [
  { id: "hasGas", type: "boolean" },
  { id: "hasGasHeating", type: "boolean", visible: (values) => values.hasGas === true },
  { id: "gasCost", type: "number", visible: (values) => values.hasGas === true },
  { id: "hasSolar", type: "boolean" },
  { id: "solar", type: "solar", visible: (values) => values.hasSolar === true },
  { id: "hasHeatPump", type: "boolean" },
  { id: "heatPump", type: "heatPump", visible: (values) => values.hasHeatPump === true },
  { id: "hasBatteries", type: "boolean" },
  { id: "battery", type: "battery", visible: (values) => values.hasBatteries === true },
  { id: "hasElectricVehicle", type: "boolean" },
  { id: "electricVehicle", type: "electricVehicle", visible: (values) => values.hasElectricVehicle === true },
  { id: "electricCost", type: "number" },
];
