import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { orderDeutschlandticket } from '@/lib/mobilitybox'

// Force mock mode for all tests
beforeAll(() => {
  process.env.MOBILITYBOX_MODE = 'mock'
})

afterAll(() => {
  delete process.env.MOBILITYBOX_MODE
})

describe('orderDeutschlandticket (mock mode)', () => {
  it('completes the full order chain and returns ticket_ready result', async () => {
    const result = await orderDeutschlandticket({
      userId: 'test-user-001',
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1990-01-01',
      postalCode: '12345',
    })

    expect(result.couponId).toBeTruthy()
    expect(result.ticketId).toBeTruthy()
    expect(result.subscriptionId).toBeTruthy()
    expect(result.ticketData).toBeDefined()
    expect(result.steps.length).toBeGreaterThan(0)

    // No real network calls: ticketData is the mock object
    const ticket = result.ticketData as Record<string, unknown>
    expect(ticket.status).toBe('active')
    expect((ticket.passenger as Record<string, string>).first_name).toBe('Max')
  })

  it('throws on mock-fail mode', async () => {
    process.env.MOBILITYBOX_MODE = 'mock-fail'
    await expect(
      orderDeutschlandticket({
        userId: 'test-fail',
        firstName: 'Fail',
        lastName: 'Test',
        birthDate: '2000-01-01',
        postalCode: 'not-germany',
      })
    ).rejects.toThrow('simulated')
    process.env.MOBILITYBOX_MODE = 'mock'
  })
})
