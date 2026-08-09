import type { DesiredPeakStorageOptions } from 'features/household-energy-comparison/models/storage'
import { BATTERY_ASSUMPTIONS } from './config'

export const calculateDesiredPeakStoredKwh = ({
  batteryReserveKwh,
  peakDispatchableStoredKwh,
  forecastPeakDemandKwh,
  batteryExportProfitable,
  batteryHomeDischargeProfitable,
}: DesiredPeakStorageOptions): number => {
  if (batteryExportProfitable) return batteryReserveKwh + peakDispatchableStoredKwh
  if (!batteryHomeDischargeProfitable) return batteryReserveKwh

  const storedEnergyForPeakDemandKwh =
    forecastPeakDemandKwh / BATTERY_ASSUMPTIONS.dischargeEfficiency
  return batteryReserveKwh + Math.min(peakDispatchableStoredKwh, storedEnergyForPeakDemandKwh)
}
