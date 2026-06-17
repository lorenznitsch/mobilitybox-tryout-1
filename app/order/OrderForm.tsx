"use client"

import { useState, FormEvent } from "react"
import { validateOrderForm } from "@/lib/validation"

interface TicketData {
  ticket_id: string
  passenger: { first_name: string; last_name: string }
  tariff: { name: string }
  valid_from: string
  valid_until: string
}

export default function OrderForm() {
  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">("form")
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [notGermany, setNotGermany] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateOrderForm({ firstName, lastName, birthDate, postalCode, notGermany })
    if (!result.valid) {
      setFieldErrors(result.errors as Record<string, string>)
      return
    }
    setFieldErrors({})
    setStep("submitting")

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, birthDate, postalCode, notGermany }),
      })
      const data = await res.json()
      if (res.ok && data.status === "ticket_ready") {
        setTicket(data.ticketData)
        setStep("success")
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.")
        setStep("error")
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.")
      setStep("error")
    }
  }

  if (step === "submitting") {
    return (
      <div style={styles.center}>
        <p style={styles.lead}>Processing your order…</p>
        <div style={styles.spinner} />
      </div>
    )
  }

  if (step === "success" && ticket) {
    return (
      <div style={styles.card} id="ticket-success">
        <h2 style={styles.successTitle}>🎉 Your Deutschlandticket is ready!</h2>
        <p style={styles.lead}>
          {ticket.passenger.first_name} {ticket.passenger.last_name}
        </p>
        <p>{ticket.tariff.name}</p>
        <p>
          Valid: {ticket.valid_from} → {ticket.valid_until}
        </p>
        {/* Wallet integration is a placeholder for a future release */}
        <button style={styles.walletBtn} disabled data-testid="wallet-btn">
          Add to Wallet (coming soon)
        </button>
        <p style={styles.hint}>
          You will receive your ticket details by email. Keep this page open or
          take a screenshot.
        </p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div style={styles.card}>
        <h2 style={{ color: "#c00" }}>Something went wrong</h2>
        <p>{errorMsg}</p>
        <button style={styles.btn} onClick={() => setStep("form")}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <h2 style={styles.formTitle}>Order your Deutschlandticket</h2>
      <p style={styles.subtitle}>
        Fill in your details below. All fields are required.
      </p>

      <Field label="First name" error={fieldErrors.firstName}>
        <input
          style={inputStyle(!!fieldErrors.firstName)}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          placeholder="Max"
        />
      </Field>

      <Field label="Last name" error={fieldErrors.lastName}>
        <input
          style={inputStyle(!!fieldErrors.lastName)}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          placeholder="Mustermann"
        />
      </Field>

      <Field label="Date of birth" error={fieldErrors.birthDate}>
        <input
          style={inputStyle(!!fieldErrors.birthDate)}
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>

      <Field label="German postal code (5 digits)" error={fieldErrors.postalCode}>
        <input
          style={inputStyle(!!fieldErrors.postalCode && !notGermany)}
          type="text"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="10115"
          disabled={notGermany}
        />
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={notGermany}
            onChange={(e) => setNotGermany(e.target.checked)}
          />{" "}
          I do not live in Germany
        </label>
      </Field>

      <button type="submit" style={styles.btn}>
        Order now →
      </button>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <span style={styles.error}>{error}</span>}
    </div>
  )
}

function inputStyle(hasError: boolean) {
  return {
    ...styles.input,
    borderColor: hasError ? "#c00" : "#ccc",
  }
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "system-ui, sans-serif",
  },
  formTitle: { fontSize: "1.5rem", marginBottom: "0.25rem" },
  subtitle: { color: "#555", marginBottom: "1.5rem" },
  field: { marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: 4 },
  label: { fontWeight: 600, fontSize: "0.9rem" },
  input: {
    padding: "0.6rem 0.75rem",
    fontSize: "1rem",
    border: "2px solid #ccc",
    borderRadius: 8,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: { color: "#c00", fontSize: "0.8rem" },
  checkLabel: { fontSize: "0.9rem", marginTop: 4, display: "flex", alignItems: "center", gap: 6 },
  btn: {
    width: "100%",
    padding: "0.85rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: "1.1rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  walletBtn: {
    width: "100%",
    padding: "0.85rem",
    background: "#555",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: "1rem",
    cursor: "not-allowed",
    marginTop: "1rem",
    opacity: 0.7,
  },
  card: {
    maxWidth: 480,
    margin: "2rem auto",
    padding: "1.5rem",
    border: "2px solid #2563eb",
    borderRadius: 12,
    fontFamily: "system-ui, sans-serif",
  },
  successTitle: { color: "#1a7a3a", fontSize: "1.4rem" },
  lead: { fontSize: "1.1rem", fontWeight: 600 },
  hint: { fontSize: "0.85rem", color: "#555", marginTop: "1rem" },
  center: {
    maxWidth: 480,
    margin: "4rem auto",
    padding: "1.5rem",
    textAlign: "center",
    fontFamily: "system-ui, sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #eee",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "1rem auto",
  },
}
