import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { orderDeutschlandticket } from '@/lib/mobilitybox'

process.env.MOBILITYBOX_MODE = 'mock'

const TEST_DB_URL = `file:${process.cwd()}/test.db`

const adapter = new PrismaLibSql({ url: TEST_DB_URL })
const testPrisma = new PrismaClient({ adapter })

beforeAll(async () => {
  await testPrisma.order.deleteMany()
})

afterAll(async () => {
  await testPrisma.order.deleteMany()
  await testPrisma.$disconnect()
})

describe('DB order flow (mock + SQLite)', () => {
  it('creates order, runs mock chain, and persists ticket_ready status with ticketId', async () => {
    const input = {
      userId: 'db-test-user',
      firstName: 'Erika',
      lastName: 'Musterfrau',
      birthDate: '1985-06-15',
      postalCode: '10115',
    }

    const record = await testPrisma.order.create({
      data: {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: new Date(input.birthDate),
        postalCode: input.postalCode,
        language: 'de',
        status: 'created',
      },
    })
    expect(record.status).toBe('created')

    const result = await orderDeutschlandticket(input)

    await testPrisma.order.update({
      where: { id: record.id },
      data: { couponId: result.couponId, status: 'activated' },
    })
    await testPrisma.order.update({
      where: { id: record.id },
      data: {
        ticketId: result.ticketId,
        subscriptionId: result.subscriptionId,
        status: 'ticket_ready',
      },
    })

    const final = await testPrisma.order.findUniqueOrThrow({ where: { id: record.id } })
    expect(final.status).toBe('ticket_ready')
    expect(final.ticketId).toBeTruthy()
    expect(final.subscriptionId).toBeTruthy()
  })
})
