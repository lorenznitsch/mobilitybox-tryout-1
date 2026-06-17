import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/lib/generated/prisma/client"

function createPrismaClient(url?: string) {
  const dbUrl = url ?? process.env.DATABASE_URL ?? "file:./dev.db"
  const adapter = new PrismaLibSql({ url: dbUrl })
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
