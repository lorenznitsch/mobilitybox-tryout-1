import { describe, it, expect } from 'vitest'
import { validateOrderForm } from '@/lib/validation'

describe('validateOrderForm', () => {
  const valid = {
    firstName: 'Max',
    lastName: 'Mustermann',
    birthDate: '1990-01-01',
    postalCode: '12345',
    notGermany: false,
  }

  it('accepts a valid form', () => {
    const r = validateOrderForm(valid)
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual({})
  })

  it('rejects empty first name', () => {
    const r = validateOrderForm({ ...valid, firstName: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.firstName).toBeTruthy()
  })

  it('rejects invalid postal code', () => {
    const r = validateOrderForm({ ...valid, postalCode: 'abc' })
    expect(r.valid).toBe(false)
    expect(r.errors.postalCode).toBeTruthy()
  })

  it('accepts 4-digit postal code as invalid', () => {
    const r = validateOrderForm({ ...valid, postalCode: '1234' })
    expect(r.valid).toBe(false)
  })

  it('skips postal code validation when notGermany=true', () => {
    const r = validateOrderForm({ ...valid, postalCode: '', notGermany: true })
    expect(r.valid).toBe(true)
    expect(r.errors.postalCode).toBeUndefined()
  })

  it('rejects missing birthDate', () => {
    const r = validateOrderForm({ ...valid, birthDate: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.birthDate).toBeTruthy()
  })
})
