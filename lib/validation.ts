export interface OrderFormData {
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD
  postalCode: string
  notGermany: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<keyof OrderFormData, string>>
}

export function validateOrderForm(data: Partial<OrderFormData>): ValidationResult {
  const errors: Partial<Record<keyof OrderFormData, string>> = {}

  if (!data.firstName?.trim()) errors.firstName = "First name is required"
  if (!data.lastName?.trim()) errors.lastName = "Last name is required"

  if (!data.birthDate) {
    errors.birthDate = "Date of birth is required"
  } else {
    const d = new Date(data.birthDate)
    if (isNaN(d.getTime())) {
      errors.birthDate = "Invalid date"
    } else {
      const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 0 || age > 120) errors.birthDate = "Please enter a valid date of birth"
    }
  }

  if (!data.notGermany) {
    if (!data.postalCode?.trim()) {
      errors.postalCode = "Postal code is required"
    } else if (!/^\d{5}$/.test(data.postalCode.trim())) {
      errors.postalCode = "Postal code must be 5 digits"
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
