import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/lib/generated/prisma/client"

/**
 * Build the libsql connection config.
 *
 * Priority:
 *  1. TURSO_DATABASE_URL + optional TURSO_AUTH_TOKEN  → Turso cloud (Vercel)
 *  2. DATABASE_URL starting with "file:"              → local SQLite
 *  3. Fallback: file:./dev.db                         → local dev default
 *
 * MOBILITYBOX_API_KEY is NOT needed at build time – it is only read at
 * request time inside lib/mobilitybox.ts (live mode only).
 */
function createPrismaClient(overrideUrl?: string) {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  let config: { url: string; authToken?: string }

  if (overrideUrl) {
    config = { url: overrideUrl }
  } else if (tursoUrl) {
    config = { url: tursoUrl, ...(tursoToken ? { authToken: tursoToken } : {}) }
  } else {
    const fileUrl = process.env.DATABASE_URL ?? "file:./dev.db"
    config = { url: fileUrl }
  }

  const adapter = new PrismaLibSql(config)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { createPrismaClient }

export async function createOrderRecord(params: {
  userId: string
  firstName: string
  lastName: string
  birthDate: string
  postalCode: string
  language?: string
}) {
  return prisma.order.create({
    data: {
      userId: params.userId,
      firstName: params.firstName,
      lastName: params.lastName,
      birthDate: new Date(params.birthDate),
      postalCode: params.postalCode,
      language: params.language ?? "en",
      status: "created",
    },
  })
}

export async function updateOrderActivated(id: string, couponId: string) {
  return prisma.order.update({
    where: { id },
    data: { couponId, status: "activated" },
  })
}

export async function updateOrderTicketReady(
  id: string,
  ticketId: string,
  subscriptionId: string
) {
  return prisma.order.update({
    where: { id },
    data: { ticketId, subscriptionId, status: "ticket_ready" },
  })
}

export async function updateOrderError(id: string) {
  return prisma.order.update({
    where: { id },
    data: { status: "error" },
  })
}
