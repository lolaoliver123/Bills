import {getBatteryCapacityKwh, getSolarCapacityKw} from "@/forms/householdSetup/schema";
import type {HouseholdScenario} from "@/forms/householdSetup/householdScenarios";

export type HourlyEnergyFlow = {
    hour: number;
    electricityDemandKwh: number;
    solarGenerationKwh: number;
    batteryChargeKwh: number;
    batteryDischargeKwh: number;
    gridImportKwh: number;
    gridExportKwh: number;
    batteryStateOfChargeKwh: number;
};

export const BATTERY_ASSUMPTIONS = {
    maxChargeKwPerUnit: 5,
    maxDischargeKwPerUnit: 5,
    chargeEfficiency: 0.95,
    dischargeEfficiency: 0.95,
    reserveFraction: 0.1,
    cheapChargeTargetFraction: 0.5,
    cheapStartHour: 0,
    cheapEndHour: 5,
    peakStartHour: 16,
    peakEndHour: 19,
} as const;

const REFERENCE_SOLAR_KW = 4.8;
const REFERENCE_HEAT_PUMP_KW = 8;
const REFERENCE_EV_CAPACITY_KWH = 50;
const REFERENCE_EV_CHARGES_PER_WEEK = 2;

// Representative energy consumed during each one-hour interval, in Wh.
const GENERAL_ELECTRICITY_WH = [
    160, 140, 130, 130, 140, 180, 420, 520, 380, 250, 220, 230,
    300, 280, 230, 240, 300, 520, 680, 720, 560, 380, 240, 180,
];
const HEAT_PUMP_ELECTRICITY_WH = [
    220, 200, 190, 180, 200, 300, 620, 760, 520, 300, 220, 180,
    170, 170, 180, 220, 300, 520, 760, 880, 720, 500, 340, 260,
];
const REFERENCE_SOLAR_GENERATION_WH = [
    0, 0, 0, 0, 0, 0, 0, 0, 120, 360, 620, 850,
    980, 900, 700, 460, 220, 60, 0, 0, 0, 0, 0, 0,
];
const EV_CHARGING_WH = [
    3570, 3570, 3570, 3570, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const whToKwh = (value: number): number => value / 1000;
const isCheapHour = (hour: number): boolean =>
    hour >= BATTERY_ASSUMPTIONS.cheapStartHour && hour < BATTERY_ASSUMPTIONS.cheapEndHour;
const isPeakHour = (hour: number): boolean =>
    hour >= BATTERY_ASSUMPTIONS.peakStartHour && hour < BATTERY_ASSUMPTIONS.peakEndHour;

export const simulateDailyEnergy = ({household, assets}: HouseholdScenario): HourlyEnergyFlow[] => {
    const solarRatio = assets.solar ? getSolarCapacityKw(assets.solar) / REFERENCE_SOLAR_KW : 0;
    const heatPumpRatio = household.heatPump.capacityKw / REFERENCE_HEAT_PUMP_KW;
    const evRatio = household.electricVehicle
        ? (household.electricVehicle.batteryCapacityKwh * household.electricVehicle.chargesPerWeek) /
          (REFERENCE_EV_CAPACITY_KWH * REFERENCE_EV_CHARGES_PER_WEEK)
        : 0;

    const batteryCapacityKwh = assets.battery ? getBatteryCapacityKwh(assets.battery) : 0;
    const reserveKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction;
    const cheapChargeTargetKwh = batteryCapacityKwh * BATTERY_ASSUMPTIONS.cheapChargeTargetFraction;
    const maxChargeKwh = (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxChargeKwPerUnit;
    const maxDischargeKwh = (assets.battery?.unitCount ?? 0) * BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit;
    let stateOfChargeKwh = reserveKwh;

    return GENERAL_ELECTRICITY_WH.map((generalElectricityWh, hour) => {
        const electricityDemandKwh = whToKwh(
            generalElectricityWh +
            HEAT_PUMP_ELECTRICITY_WH[hour] * heatPumpRatio +
            EV_CHARGING_WH[hour] * evRatio,
        );
        const solarGenerationKwh = whToKwh(REFERENCE_SOLAR_GENERATION_WH[hour] * solarRatio);
        const directSolarKwh = Math.min(electricityDemandKwh, solarGenerationKwh);
        let remainingDemandKwh = electricityDemandKwh - directSolarKwh;
        let surplusSolarKwh = solarGenerationKwh - directSolarKwh;
        let batteryChargeKwh = 0;
        let batteryDischargeKwh = 0;
        let gridImportKwh: number;
        let gridExportKwh: number;

        if (!assets.battery) {
            gridImportKwh = remainingDemandKwh;
            gridExportKwh = surplusSolarKwh;
        } else if (isPeakHour(hour)) {
            const availableDischargeKwh = Math.min(
                maxDischargeKwh,
                Math.max(0, stateOfChargeKwh - reserveKwh) * BATTERY_ASSUMPTIONS.dischargeEfficiency,
            );
            const dischargeToHomeKwh = Math.min(remainingDemandKwh, availableDischargeKwh);
            const dischargeToGridKwh = Math.min(
                maxDischargeKwh - dischargeToHomeKwh,
                availableDischargeKwh - dischargeToHomeKwh,
            );

            batteryDischargeKwh = dischargeToHomeKwh + dischargeToGridKwh;
            stateOfChargeKwh -= batteryDischargeKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency;
            remainingDemandKwh -= dischargeToHomeKwh;
            gridImportKwh = remainingDemandKwh;
            gridExportKwh = surplusSolarKwh + dischargeToGridKwh;
        } else {
            const solarChargeKwh = Math.min(
                surplusSolarKwh,
                maxChargeKwh,
                Math.max(0, batteryCapacityKwh - stateOfChargeKwh) / BATTERY_ASSUMPTIONS.chargeEfficiency,
            );
            batteryChargeKwh += solarChargeKwh;
            stateOfChargeKwh += solarChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency;
            surplusSolarKwh -= solarChargeKwh;

            let gridChargeKwh = 0;
            if (isCheapHour(hour)) {
                gridChargeKwh = Math.min(
                    maxChargeKwh - batteryChargeKwh,
                    Math.max(0, cheapChargeTargetKwh - stateOfChargeKwh) / BATTERY_ASSUMPTIONS.chargeEfficiency,
                );
                batteryChargeKwh += gridChargeKwh;
                stateOfChargeKwh += gridChargeKwh * BATTERY_ASSUMPTIONS.chargeEfficiency;
            }

            gridImportKwh = remainingDemandKwh + gridChargeKwh;
            gridExportKwh = surplusSolarKwh;
        }

        stateOfChargeKwh = Math.min(batteryCapacityKwh, Math.max(reserveKwh, stateOfChargeKwh));

        return {
            hour,
            electricityDemandKwh,
            solarGenerationKwh,
            batteryChargeKwh,
            batteryDischargeKwh,
            gridImportKwh,
            gridExportKwh,
            batteryStateOfChargeKwh: stateOfChargeKwh,
        };
    });
};
