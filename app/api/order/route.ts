import { NextRequest, NextResponse } from "next/server"
import { validateOrderForm } from "@/lib/validation"
import { orderDeutschlandticket } from "@/lib/mobilitybox"
import {
  createOrderRecord,
  updateOrderActivated,
  updateOrderTicketReady,
  updateOrderError,
} from "@/lib/db"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { firstName, lastName, birthDate, postalCode, notGermany, language } = body

  const validation = validateOrderForm({ firstName, lastName, birthDate, postalCode, notGermany })
  if (!validation.valid) {
    return NextResponse.json({ error: "Validation failed", fields: validation.errors }, { status: 422 })
  }

  const resolvedPostalCode = notGermany ? "not-germany" : postalCode.trim()
  const userId = randomUUID()

  const record = await createOrderRecord({
    userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    birthDate,
    postalCode: resolvedPostalCode,
    language: language ?? "en",
  })

  try {
    const result = await orderDeutschlandticket({
      userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      postalCode: resolvedPostalCode,
    })

    await updateOrderActivated(record.id, result.couponId)
    await updateOrderTicketReady(record.id, result.ticketId, result.subscriptionId)

    return NextResponse.json({
      status: "ticket_ready",
      orderId: record.id,
      ticketData: result.ticketData,
    })
  } catch (err) {
    await updateOrderError(record.id)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ status: "error", error: message }, { status: 500 })
  }
}
