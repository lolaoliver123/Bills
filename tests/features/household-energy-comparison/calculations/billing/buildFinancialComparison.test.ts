import { describe, expect, it } from 'vitest'
import { buildFinancialComparison } from 'features/household-energy-comparison/calculations/billing/buildFinancialComparison'
import { scenario } from 'testing/householdEnergyComparison'

describe('scenario financial comparison', () => {
  it('uses one calibrated demand for every scenario and calculates savings', () => {
    const current = scenario()
    const solar = scenario({
      id: 'solar',
      label: 'With proposed solar',
      assets: { solar: { panelCount: 10, panelCapacityKw: 0.4 } },
    })
    const comparison = buildFinancialComparison([current, solar], 120)

    expect('kind' in comparison).toBe(false)
    if ('kind' in comparison) return
    const currentDemand = comparison.results[0].energyFlows.reduce(
      (total, item) => total + item.electricityDemandKwh,
      0,
    )
    const solarDemand = comparison.results[1].energyFlows.reduce(
      (total, item) => total + item.electricityDemandKwh,
      0,
    )
    expect(solarDemand).toBeCloseTo(currentDemand)
    expect(comparison.results[0].monthlySavings).toBeCloseTo(0)
    expect(comparison.results[1].monthlySavings).toBeGreaterThan(0)
    expect(comparison.inferredAnnualDemandKwh).toBeCloseTo(comparison.inferredDailyDemandKwh * 365)
  })
})
