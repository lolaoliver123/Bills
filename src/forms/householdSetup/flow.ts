import type { Household } from "./schema";

export type Question = {
  id: string;
  type: "boolean" | "number" | "solar" | "battery" | "heatPump" | "electricVehicle";
  visible?: (values: Household) => boolean;
};

export const questions: Question[] = [
  { id: "hasSolar", type: "boolean" },
  { id: "solar", type: "solar", visible: (values) => values.hasSolar === true },
  { id: "heatPump", type: "heatPump" },
  { id: "hasBatteries", type: "boolean" },
  { id: "battery", type: "battery", visible: (values) => values.hasBatteries === true },
  { id: "hasElectricVehicle", type: "boolean" },
  { id: "electricVehicle", type: "electricVehicle", visible: (values) => values.hasElectricVehicle === true },
  { id: "electricCost", type: "number" },
];
