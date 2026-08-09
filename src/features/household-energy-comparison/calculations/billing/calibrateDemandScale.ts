import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import { calculateBill } from './calculateBill'
import type {
  CalibrationError,
  ElectricityTariff,
} from 'features/household-energy-comparison/models/billing'
import { simulateDailyEnergy } from 'features/household-energy-comparison/calculations/simulation/simulation'
import {
  CALIBRATION_ITERATIONS,
  CALIBRATION_TOLERANCE_GBP,
  DEFAULT_ELECTRICITY_TARIFF,
  MAX_DEMAND_SCALE,
} from './config'

const monthlySupplierBillAtScale = (
  scenario: HouseholdScenario,
  demandScale: number,
  tariff: ElectricityTariff,
): number =>
  calculateBill(simulateDailyEnergy(scenario, { demandScale, tariff }), tariff).monthly.supplierBill

const findUpperScale = (
  scenario: HouseholdScenario,
  targetMonthlySupplierBill: number,
  tariff: ElectricityTariff,
  upperScale = 1,
): number =>
  monthlySupplierBillAtScale(scenario, upperScale, tariff) < targetMonthlySupplierBill &&
  upperScale < MAX_DEMAND_SCALE
    ? findUpperScale(scenario, targetMonthlySupplierBill, tariff, upperScale * 2)
    : upperScale

const findDemandScale = (
  scenario: HouseholdScenario,
  targetMonthlySupplierBill: number,
  tariff: ElectricityTariff,
  lowerScale: number,
  upperScale: number,
  iterationsRemaining = CALIBRATION_ITERATIONS,
): number => {
  const midpoint = (lowerScale + upperScale) / 2
  if (iterationsRemaining === 0) return midpoint

  const midpointBill = monthlySupplierBillAtScale(scenario, midpoint, tariff)
  if (Math.abs(midpointBill - targetMonthlySupplierBill) <= CALIBRATION_TOLERANCE_GBP)
    return midpoint

  return midpointBill < targetMonthlySupplierBill
    ? findDemandScale(
        scenario,
        targetMonthlySupplierBill,
        tariff,
        midpoint,
        upperScale,
        iterationsRemaining - 1,
      )
    : findDemandScale(
        scenario,
        targetMonthlySupplierBill,
        tariff,
        lowerScale,
        midpoint,
        iterationsRemaining - 1,
      )
}

export const calibrateDemandScale = (
  currentScenario: HouseholdScenario,
  targetMonthlySupplierBill: number,
  tariff = DEFAULT_ELECTRICITY_TARIFF,
): number | CalibrationError => {
  const minimumMonthlySupplierBill = monthlySupplierBillAtScale(currentScenario, 0, tariff)
  if (targetMonthlySupplierBill < minimumMonthlySupplierBill - CALIBRATION_TOLERANCE_GBP) {
    return {
      kind: 'calibration-error',
      message: `The entered bill is below the modeled minimum of £${minimumMonthlySupplierBill.toFixed(2)} per month.`,
      minimumMonthlySupplierBill,
    }
  }

  const upperScale = findUpperScale(currentScenario, targetMonthlySupplierBill, tariff)

  const maximumMonthlySupplierBill = monthlySupplierBillAtScale(currentScenario, upperScale, tariff)
  if (maximumMonthlySupplierBill < targetMonthlySupplierBill - CALIBRATION_TOLERANCE_GBP) {
    return {
      kind: 'calibration-error',
      message: `The entered bill is above the modeled maximum of £${maximumMonthlySupplierBill.toFixed(2)} per month.`,
      minimumMonthlySupplierBill,
      maximumMonthlySupplierBill,
    }
  }

  return findDemandScale(currentScenario, targetMonthlySupplierBill, tariff, 0, upperScale)
}
