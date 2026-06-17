import { NextResponse } from "next/server"
import { orderDeutschlandticket } from "@/lib/mobilitybox"
import {
  createOrderRecord,
  updateOrderActivated,
  updateOrderTicketReady,
  updateOrderError,
} from "@/lib/db"

const TEST_INPUT = {
  userId: "test-user-001",
  firstName: "Max",
  lastName: "Mustermann",
  birthDate: "1990-01-01",
  postalCode: "12345",
}

export async function GET() {
  const record = await createOrderRecord(TEST_INPUT)
  try {
    const result = await orderDeutschlandticket(TEST_INPUT)
    await updateOrderActivated(record.id, result.couponId)
    await updateOrderTicketReady(record.id, result.ticketId, result.subscriptionId)
    return NextResponse.json({ status: "ticket_ready", orderId: record.id, ...result })
  } catch (err) {
    await updateOrderError(record.id)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ status: "error", orderId: record.id, error: message }, { status: 500 })
  }
}
