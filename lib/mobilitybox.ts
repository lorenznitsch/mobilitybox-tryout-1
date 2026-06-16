const PRODUCT_ID = "mobilitybox-product-60a7c799-ffa4-45a7-ba1a-a5d361f05921"
const BASE_URL = "https://api.themobilitybox.com"

export interface OrderInput {
  userId: string
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD
  postalCode: string // or "not-germany"
}

export interface OrderResult {
  couponId: string
  ticketId: string
  subscriptionId: string
  ticketData: Record<string, unknown>
  steps: string[]
}

// --- Mock helpers ---

function mockOrderResponse(userId: string) {
  return {
    id: `mock-order-${userId}`,
    coupon_id: `mock-coupon-${crypto.randomUUID()}`,
    product_ids: [PRODUCT_ID],
    optional_order_reference: userId,
  }
}

function mockActivateResponse(couponId: string) {
  return {
    coupon_id: couponId,
    ticket_id: `mock-ticket-${crypto.randomUUID()}`,
    status: "activated",
  }
}

function mockTicketResponse(ticketId: string, input: OrderInput) {
  return {
    ticket_id: ticketId,
    subscription_id: `mock-sub-${crypto.randomUUID()}`,
    status: "active",
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    passenger: {
      first_name: input.firstName,
      last_name: input.lastName,
      birth_date: input.birthDate,
    },
    tariff: {
      name: "Deutschlandticket",
      german_postal_code: input.postalCode,
    },
  }
}

// --- Live API calls ---

async function createOrder(userId: string, apiKey: string): Promise<{ couponId: string }> {
  const res = await fetch(`${BASE_URL}/v6/ticketing/orders.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_ids: [PRODUCT_ID],
      optional_order_reference: userId,
    }),
  })
  if (!res.ok) throw new Error(`Order failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { couponId: data.coupon_id }
}

async function activateCoupon(
  couponId: string,
  input: OrderInput,
  apiKey: string
): Promise<{ ticketId: string }> {
  const res = await fetch(`${BASE_URL}/v6/ticketing/coupons/${couponId}/activate.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identification_medium: {
        photo_id_lite: {
          first_name: input.firstName,
          last_name: input.lastName,
          birth_date: input.birthDate,
        },
      },
      tariff_settings: {
        german_postal_code: input.postalCode,
      },
    }),
  })
  if (!res.ok) throw new Error(`Activate failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { ticketId: data.ticket_id }
}

async function getTicket(
  ticketId: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/v6/ticketing/tickets/${ticketId}.json`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Ticket fetch failed: ${res.status} ${await res.text()}`)
  return res.json()
}

// --- Main orchestrator ---

export async function orderDeutschlandticket(input: OrderInput): Promise<OrderResult> {
  const mode = process.env.MOBILITYBOX_MODE ?? "mock"
  const steps: string[] = []

  if (mode === "mock-fail") {
    steps.push("mock-fail: simulating Mobilitybox API error")
    throw new Error("Mobilitybox API error (simulated by MOBILITYBOX_MODE=mock-fail)")
  }

  if (mode === "mock") {
    steps.push("mock: creating order")
    const orderData = mockOrderResponse(input.userId)
    const couponId = orderData.coupon_id
    steps.push(`mock: order created, coupon_id=${couponId}`)

    steps.push("mock: activating coupon")
    const activateData = mockActivateResponse(couponId)
    const ticketId = activateData.ticket_id
    steps.push(`mock: coupon activated, ticket_id=${ticketId}`)

    steps.push("mock: fetching ticket")
    const ticketData = mockTicketResponse(ticketId, input)
    const subscriptionId = ticketData.subscription_id
    steps.push(`mock: ticket ready, subscription_id=${subscriptionId}`)

    return { couponId, ticketId, subscriptionId, ticketData, steps }
  }

  // live mode
  const apiKey = process.env.MOBILITYBOX_API_KEY
  if (!apiKey) throw new Error("MOBILITYBOX_API_KEY is not set")

  steps.push("live: creating order")
  const { couponId } = await createOrder(input.userId, apiKey)
  steps.push(`live: order created, coupon_id=${couponId}`)

  steps.push("live: activating coupon")
  const { ticketId } = await activateCoupon(couponId, input, apiKey)
  steps.push(`live: coupon activated, ticket_id=${ticketId}`)

  steps.push("live: fetching ticket")
  const ticketData = await getTicket(ticketId, apiKey)
  const subscriptionId = (ticketData.subscription_id as string) ?? ""
  steps.push(`live: ticket ready`)

  return { couponId, ticketId, subscriptionId, ticketData, steps }
}
