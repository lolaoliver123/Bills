import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import type {
  CalibrationError,
  FinancialComparison,
} from 'features/household-energy-comparison/models/billing'
import { simulateDailyEnergy } from 'features/household-energy-comparison/calculations/simulation/simulation'
import { calculateBill } from './calculateBill'
import { calibrateDemandScale } from './calibrateDemandScale'
import { DAYS_PER_YEAR, DEFAULT_ELECTRICITY_TARIFF } from './config'

export const buildFinancialComparison = (
  scenarios: HouseholdScenario[],
  targetMonthlySupplierBill: number,
  tariff = DEFAULT_ELECTRICITY_TARIFF,
): FinancialComparison | CalibrationError => {
  const currentScenario = scenarios[0]

  const calibration = calibrateDemandScale(currentScenario, targetMonthlySupplierBill, tariff)
  if (typeof calibration !== 'number') return calibration

  const priced = scenarios.map((scenario) => {
    const energyFlows = simulateDailyEnergy(scenario, { demandScale: calibration })
    return { scenario, energyFlows, bill: calculateBill(energyFlows, tariff) }
  })
  const currentNetMonthly = priced[0].bill.monthly.netCost
  const currentNetAnnual = priced[0].bill.annual.netCost
  const inferredDailyDemandKwh = priced[0].energyFlows.reduce(
    (total, flow) => total + flow.electricityDemandKwh,
    0,
  )

  return {
    demandScale: calibration,
    inferredDailyDemandKwh,
    inferredAnnualDemandKwh: inferredDailyDemandKwh * DAYS_PER_YEAR,
    results: priced.map((result) => ({
      ...result,
      monthlySavings: currentNetMonthly - result.bill.monthly.netCost,
      annualSavings: currentNetAnnual - result.bill.annual.netCost,
    })),
  }
}
