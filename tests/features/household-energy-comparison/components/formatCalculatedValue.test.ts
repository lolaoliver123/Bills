import { describe, expect, it } from 'vitest'
import { formatCalculatedValue } from 'features/household-energy-comparison/components/formatCalculatedValue'

describe('calculated value formatting', () => {
  it.each([
    [5, '5.00'],
    [5.1, '5.10'],
    [5.126, '5.13'],
    [0, '0.00'],
    [-1.235, '-1.24'],
  ])('formats %s to two decimal places', (value, expected) => {
    expect(formatCalculatedValue(value)).toBe(expected)
  })
})
