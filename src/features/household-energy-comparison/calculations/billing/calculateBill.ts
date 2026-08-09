import type { BillEstimate, PeriodBill } from 'features/household-energy-comparison/models/billing'
import { DAYS_PER_YEAR, DEFAULT_ELECTRICITY_TARIFF, MONTHS_PER_YEAR } from './config'
import type { HourlyEnergyFlow } from 'features/household-energy-comparison/models/simulation'
import {
  getExportRate,
  getImportRate,
} from 'features/household-energy-comparison/calculations/tariff'

export {
  getExportRate,
  getImportRate,
} from 'features/household-energy-comparison/calculations/tariff'

const scalePeriodBill = (bill: PeriodBill, factor: number): PeriodBill => ({
  supplierBill: bill.supplierBill * factor,
  exportEarnings: bill.exportEarnings * factor,
  netCost: bill.netCost * factor,
})

export const calculateBill = (
  energyFlows: HourlyEnergyFlow[],
  tariff = DEFAULT_ELECTRICITY_TARIFF,
): BillEstimate => {
  const importCost = energyFlows.reduce(
    (total, flow) => total + flow.gridImportKwh * getImportRate(flow.hour, tariff),
    0,
  )
  const exportEarnings = energyFlows.reduce(
    (total, flow) => total + flow.gridExportKwh * getExportRate(flow.hour, tariff),
    0,
  )
  const daily: PeriodBill = {
    supplierBill: importCost + tariff.standingChargeGbpPerDay,
    exportEarnings,
    netCost: importCost + tariff.standingChargeGbpPerDay - exportEarnings,
  }

  return {
    daily,
    monthly: scalePeriodBill(daily, DAYS_PER_YEAR / MONTHS_PER_YEAR),
    annual: scalePeriodBill(daily, DAYS_PER_YEAR),
  }
}
