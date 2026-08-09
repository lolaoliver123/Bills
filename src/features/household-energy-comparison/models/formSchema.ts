import * as z from 'zod'

export const MAX_MONTHLY_ELECTRICITY_COST_GBP = 2_000
export const DEFAULT_HEAT_PUMP_SCOP = 2.8

const optionalNumber = z.number().optional()

const required = (
  ctx: z.RefinementCtx,
  path: (string | number)[],
  message = 'This field is required',
) => {
  ctx.addIssue({ code: 'custom', path, message })
}

const requirePositive = (
  ctx: z.RefinementCtx,
  value: number | undefined,
  path: (string | number)[],
) => {
  if (value === undefined) required(ctx, path)
  else if (value <= 0) ctx.addIssue({ code: 'custom', path, message: 'Must be greater than 0' })
}

const requirePositiveInteger = (
  ctx: z.RefinementCtx,
  value: number | undefined,
  path: (string | number)[],
) => {
  requirePositive(ctx, value, path)
  if (value !== undefined && !Number.isInteger(value)) {
    ctx.addIssue({ code: 'custom', path, message: 'Must be a whole number' })
  }
}

export const householdFormSchema = z
  .object({
    hasSolar: z.boolean().optional(),
    hasBatteries: z.boolean().optional(),
    hasElectricVehicle: z.boolean().optional(),
    monthlyElectricityCost: optionalNumber,
    heatPump: z.object({
      capacityKw: optionalNumber,
      annualSpaceHeatingDemandKwh: optionalNumber,
      suppliesHotWater: z.boolean().optional(),
      annualHotWaterDemandKwh: optionalNumber,
      scop: optionalNumber,
    }),
    solar: z.object({ panelCount: optionalNumber, panelCapacityKw: optionalNumber }),
    battery: z.object({ unitCount: optionalNumber, unitCapacityKwh: optionalNumber }),
    electricVehicle: z.object({
      batteryCapacityKwh: optionalNumber,
      chargesPerWeek: optionalNumber,
      canSupplyGrid: z.boolean().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    ;(['hasSolar', 'hasBatteries', 'hasElectricVehicle'] as const).forEach((field) => {
      if (data[field] === undefined) required(ctx, [field], 'Please choose yes or no')
    })

    requirePositive(ctx, data.monthlyElectricityCost, ['monthlyElectricityCost'])
    if (
      data.monthlyElectricityCost !== undefined &&
      data.monthlyElectricityCost > MAX_MONTHLY_ELECTRICITY_COST_GBP
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthlyElectricityCost'],
        message: 'Must be £2,000 or less',
      })
    }
    requirePositive(ctx, data.heatPump.capacityKw, ['heatPump', 'capacityKw'])
    requirePositive(ctx, data.heatPump.annualSpaceHeatingDemandKwh, [
      'heatPump',
      'annualSpaceHeatingDemandKwh',
    ])
    requirePositive(ctx, data.heatPump.scop, ['heatPump', 'scop'])
    if (data.heatPump.suppliesHotWater === undefined) {
      required(ctx, ['heatPump', 'suppliesHotWater'], 'Please choose yes or no')
    } else if (data.heatPump.suppliesHotWater) {
      requirePositive(ctx, data.heatPump.annualHotWaterDemandKwh, [
        'heatPump',
        'annualHotWaterDemandKwh',
      ])
    }

    if (data.hasSolar !== undefined) {
      requirePositiveInteger(ctx, data.solar.panelCount, ['solar', 'panelCount'])
      if (data.hasSolar)
        requirePositive(ctx, data.solar.panelCapacityKw, ['solar', 'panelCapacityKw'])
    }

    if (data.hasBatteries !== undefined) {
      requirePositiveInteger(ctx, data.battery.unitCount, ['battery', 'unitCount'])
      requirePositive(ctx, data.battery.unitCapacityKwh, ['battery', 'unitCapacityKwh'])
    }

    if (data.hasElectricVehicle) {
      requirePositive(ctx, data.electricVehicle.batteryCapacityKwh, [
        'electricVehicle',
        'batteryCapacityKwh',
      ])
      requirePositive(ctx, data.electricVehicle.chargesPerWeek, [
        'electricVehicle',
        'chargesPerWeek',
      ])
      if (data.electricVehicle.canSupplyGrid === undefined) {
        required(ctx, ['electricVehicle', 'canSupplyGrid'], 'Please choose yes or no')
      }
    }
  })

export type HouseholdFormDraft = z.infer<typeof householdFormSchema>

export const initialValues: HouseholdFormDraft = {
  hasSolar: undefined,
  hasBatteries: undefined,
  hasElectricVehicle: undefined,
  monthlyElectricityCost: undefined,
  heatPump: {
    capacityKw: undefined,
    annualSpaceHeatingDemandKwh: undefined,
    suppliesHotWater: undefined,
    annualHotWaterDemandKwh: undefined,
    scop: DEFAULT_HEAT_PUMP_SCOP,
  },
  solar: { panelCount: undefined, panelCapacityKw: undefined },
  battery: { unitCount: undefined, unitCapacityKwh: undefined },
  electricVehicle: {
    batteryCapacityKwh: undefined,
    chargesPerWeek: undefined,
    canSupplyGrid: undefined,
  },
}
