import { describe, expect, it } from 'vitest'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import { simulateDailyEnergy } from 'features/household-energy-comparison/calculations/simulation/simulation'
import { BATTERY_ASSUMPTIONS } from 'features/household-energy-comparison/calculations/simulation/config'

const scenario = (assets: HouseholdScenario['assets']): HouseholdScenario => ({
  id: 'current',
  label: 'Test household',
  description: 'Test scenario',
  household: {
    heatPump: { capacityKw: 8 },
    monthlyElectricityCost: 120,
  },
  assets,
})

const battery = { unitCount: 1, unitCapacityKwh: 13.5 }

describe('daily energy simulation', () => {
  it('reports heat-pump demand separately while retaining it in total demand', () => {
    const result = simulateDailyEnergy(scenario({}))

    expect(result.some(({ heatPumpDemandKwh }) => heatPumpDemandKwh > 0)).toBe(true)
    for (const hour of result) {
      expect(hour.electricityDemandKwh).toBeGreaterThanOrEqual(hour.heatPumpDemandKwh)
    }
  })

  it('does not dispatch storage when no battery is installed', () => {
    const result = simulateDailyEnergy(
      scenario({ solar: { panelCount: 12, panelCapacityKw: 0.4 } }),
    )

    expect(result).toHaveLength(24)
    expect(
      result.every(
        ({ batteryChargeKwh, batteryDischargeKwh, batteryStateOfChargeKwh }) =>
          batteryChargeKwh === 0 && batteryDischargeKwh === 0 && batteryStateOfChargeKwh === 0,
      ),
    ).toBe(true)
  })

  it('grid-charges only in the cheap window and stops at the 50% target', () => {
    const result = simulateDailyEnergy(scenario({ battery }))
    const targetKwh = battery.unitCapacityKwh * BATTERY_ASSUMPTIONS.cheapChargeTargetFraction

    expect(result.some(({ hour, batteryChargeKwh }) => hour < 5 && batteryChargeKwh > 0)).toBe(true)
    expect(
      result
        .filter(({ hour }) => hour >= 5 && hour < 16)
        .every(({ batteryChargeKwh }) => batteryChargeKwh === 0),
    ).toBe(true)
    expect(result[4].batteryStateOfChargeKwh).toBeCloseTo(targetKwh)
  })

  it('charges from surplus solar outside the cheap window', () => {
    const result = simulateDailyEnergy(
      scenario({
        solar: { panelCount: 12, panelCapacityKw: 0.4 },
        battery,
      }),
    )

    expect(
      result.some(({ hour, batteryChargeKwh }) => hour >= 8 && hour < 16 && batteryChargeKwh > 0),
    ).toBe(true)
  })

  it('discharges only during the peak window', () => {
    const result = simulateDailyEnergy(scenario({ battery }))

    expect(
      result.some(
        ({ hour, batteryDischargeKwh }) => hour >= 16 && hour < 19 && batteryDischargeKwh > 0,
      ),
    ).toBe(true)
    expect(
      result
        .filter(({ hour }) => hour < 16 || hour >= 19)
        .every(({ batteryDischargeKwh }) => batteryDischargeKwh === 0),
    ).toBe(true)
  })

  it('keeps state of charge within reserve and total capacity', () => {
    const result = simulateDailyEnergy(
      scenario({
        solar: { panelCount: 12, panelCapacityKw: 0.4 },
        battery,
      }),
    )
    const reserveKwh = battery.unitCapacityKwh * BATTERY_ASSUMPTIONS.reserveFraction

    for (const hour of result) {
      expect(hour.batteryStateOfChargeKwh).toBeGreaterThanOrEqual(reserveKwh)
      expect(hour.batteryStateOfChargeKwh).toBeLessThanOrEqual(battery.unitCapacityKwh)
      expect(hour.batteryChargeKwh).toBeLessThanOrEqual(BATTERY_ASSUMPTIONS.maxChargeKwPerUnit)
      expect(hour.batteryDischargeKwh).toBeLessThanOrEqual(
        BATTERY_ASSUMPTIONS.maxDischargeKwPerUnit,
      )
    }
  })

  it('exports remaining peak discharge after serving the household', () => {
    const peak = simulateDailyEnergy(scenario({ battery }))[16]

    expect(peak.batteryDischargeKwh).toBeGreaterThan(peak.electricityDemandKwh)
    expect(peak.gridImportKwh).toBe(0)
    expect(peak.gridExportKwh).toBeGreaterThan(0)
  })

  it('does not charge the battery during a peak solar surplus', () => {
    const peak = simulateDailyEnergy(
      scenario({
        solar: { panelCount: 12, panelCapacityKw: 123 },
        battery,
      }),
    )[16]

    expect(peak.solarGenerationKwh).toBeGreaterThan(peak.electricityDemandKwh)
    expect(peak.batteryChargeKwh).toBe(0)
    expect(peak.gridExportKwh).toBeGreaterThan(0)
  })

  it('balances external energy in every hour', () => {
    const result = simulateDailyEnergy(
      scenario({
        solar: { panelCount: 12, panelCapacityKw: 0.4 },
        battery,
      }),
    )

    for (const hour of result) {
      const supplied = hour.gridImportKwh + hour.solarGenerationKwh + hour.batteryDischargeKwh
      const consumed = hour.electricityDemandKwh + hour.batteryChargeKwh + hour.gridExportKwh
      expect(supplied).toBeCloseTo(consumed, 10)
    }
  })
})
