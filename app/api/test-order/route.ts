import { NextResponse } from "next/server"
import { orderDeutschlandticket } from "@/lib/mobilitybox"

export async function GET() {
  try {
    const result = await orderDeutschlandticket({
      userId: "test-user-001",
      firstName: "Max",
      lastName: "Mustermann",
      birthDate: "1990-01-01",
      postalCode: "12345",
    })
    return NextResponse.json({ status: "ticket_ready", ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ status: "error", error: message }, { status: 500 })
  }
}
