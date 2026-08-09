import { describe, expect, it } from 'vitest'
import type { HouseholdScenario } from 'features/household-energy-comparison/models/householdScenarios'
import { simulateDailyEnergy } from 'features/household-energy-comparison/calculations/simulation/simulation'
import {
  BATTERY_ASSUMPTIONS,
  EV_ASSUMPTIONS,
  REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR,
} from 'features/household-energy-comparison/calculations/simulation/config'
import { DEFAULT_ELECTRICITY_TARIFF } from 'features/household-energy-comparison/calculations/billing/config'

const scenario = (assets: HouseholdScenario['assets']): HouseholdScenario => ({
  id: 'current',
  label: 'Test household',
  description: 'Test scenario',
  household: {
    heatPump: {
      capacityKw: 8,
      annualSpaceHeatingDemandKwh: 9_106,
      suppliesHotWater: false,
      annualHotWaterDemandKwh: 0,
      scop: 2.8,
    },
    monthlyElectricityCost: 120,
  },
  assets,
})

const battery = { unitCount: 1, unitCapacityKwh: 13.5 }
const electricVehicle = {
  batteryCapacityKwh: 50,
  chargesPerWeek: 2,
  canSupplyGrid: true,
}

const scenarioWithEv = (canSupplyGrid = true): HouseholdScenario => {
  const base = scenario({})
  return {
    ...base,
    household: {
      ...base.household,
      electricVehicle: { ...electricVehicle, canSupplyGrid },
    },
  }
}

describe('daily energy simulation', () => {
  it('reports heat-pump demand separately while retaining it in total demand', () => {
    const result = simulateDailyEnergy(scenario({}))

    expect(result.some(({ heatPumpDemandKwh }) => heatPumpDemandKwh > 0)).toBe(true)
    for (const hour of result) {
      expect(hour.electricityDemandKwh).toBeGreaterThanOrEqual(hour.heatPumpDemandKwh)
    }
    const annualHeatPumpElectricity =
      result.reduce((total, hour) => total + hour.heatPumpDemandKwh, 0) * 365
    expect(annualHeatPumpElectricity).toBeCloseTo(9_106 / 2.8)
  })

  it('normalizes solar generation to the researched annual yield', () => {
    const capacityKw = 4
    const result = simulateDailyEnergy(
      scenario({ solar: { panelCount: 10, panelCapacityKw: 0.4 } }),
    )
    const annualSolarKwh = result.reduce((total, hour) => total + hour.solarGenerationKwh, 0) * 365

    expect(annualSolarKwh).toBeCloseTo(capacityKw * REFERENCE_SOLAR_YIELD_KWH_PER_KWP_YEAR)
  })

  it('reports EV charging separately while retaining it in total demand', () => {
    const result = simulateDailyEnergy(scenarioWithEv())

    expect(result.some(({ evChargeKwh }) => evChargeKwh > 0)).toBe(true)
    for (const hour of result) {
      expect(hour.electricityDemandKwh).toBeGreaterThanOrEqual(
        hour.heatPumpDemandKwh + hour.evChargeKwh,
      )
    }
  })

  it('serves the household before exporting from a grid-enabled EV during the peak window', () => {
    const result = simulateDailyEnergy(scenarioWithEv())

    expect(
      result.some(({ hour, evDischargeKwh }) => hour >= 16 && hour < 19 && evDischargeKwh > 0),
    ).toBe(true)
    expect(
      result
        .filter(({ hour }) => hour < 16 || hour >= 19)
        .every(({ evDischargeKwh }) => evDischargeKwh === 0),
    ).toBe(true)
    for (const hour of result.filter(({ hour }) => hour >= 16 && hour < 19)) {
      expect(hour.evDischargeKwh).toBeLessThanOrEqual(EV_ASSUMPTIONS.maxDischargeKw)
      if (hour.gridExportKwh > 0) expect(hour.gridImportKwh).toBe(0)
    }
    expect(result.some(({ hour, gridExportKwh }) => hour >= 16 && gridExportKwh > 0)).toBe(true)

    const charged = result.reduce((total, hour) => total + hour.evChargeKwh, 0)
    const discharged = result.reduce((total, hour) => total + hour.evDischargeKwh, 0)
    expect(discharged).toBeCloseTo(
      charged * EV_ASSUMPTIONS.chargeEfficiency * EV_ASSUMPTIONS.dischargeEfficiency,
    )
  })

  it('does not discharge an EV that cannot supply the grid', () => {
    const result = simulateDailyEnergy(scenarioWithEv(false))

    expect(result.every(({ evDischargeKwh }) => evDischargeKwh === 0)).toBe(true)
  })

  it('leaves a grid-enabled EV charged when peak discharge is uneconomic', () => {
    const tariff = {
      ...DEFAULT_ELECTRICITY_TARIFF,
      nightImportGbpPerKwh: 0.2,
      dayImportGbpPerKwh: 0.15,
      peakExportGbpPerKwh: 0.1,
    }
    const result = simulateDailyEnergy(scenarioWithEv(), { tariff })

    expect(result.every(({ evDischargeKwh }) => evDischargeKwh === 0)).toBe(true)
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

  it('grid-charges to the economically dispatchable target during the cheap window', () => {
    const result = simulateDailyEnergy(scenario({ battery }))

    expect(result.some(({ hour, batteryChargeKwh }) => hour < 7 && batteryChargeKwh > 0)).toBe(true)
    expect(
      result
        .filter(({ hour }) => hour >= 7 && hour < 16)
        .every(({ batteryChargeKwh }) => batteryChargeKwh === 0),
    ).toBe(true)
    expect(result[6].batteryStateOfChargeKwh).toBeCloseTo(battery.unitCapacityKwh)
  })

  it('leaves storage idle when neither peak use nor export is profitable', () => {
    const tariff = {
      ...DEFAULT_ELECTRICITY_TARIFF,
      nightImportGbpPerKwh: 0.2,
      dayImportGbpPerKwh: 0.15,
      peakExportGbpPerKwh: 0.1,
    }
    const result = simulateDailyEnergy(scenario({ battery }), { tariff })

    expect(result.every(({ batteryChargeKwh }) => batteryChargeKwh === 0)).toBe(true)
    expect(result.every(({ batteryDischargeKwh }) => batteryDischargeKwh === 0)).toBe(true)
  })

  it('charges from surplus solar outside the cheap window', () => {
    const evScenario = scenarioWithEv()
    const result = simulateDailyEnergy({
      ...evScenario,
      assets: { solar: { panelCount: 12, panelCapacityKw: 0.4 }, battery },
    })

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
      const supplied =
        hour.gridImportKwh +
        hour.solarGenerationKwh +
        hour.batteryDischargeKwh +
        hour.evDischargeKwh
      const consumed = hour.electricityDemandKwh + hour.batteryChargeKwh + hour.gridExportKwh
      expect(supplied).toBeCloseTo(consumed, 10)
    }
  })
})
