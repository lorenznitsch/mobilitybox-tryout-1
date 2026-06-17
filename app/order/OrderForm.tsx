"use client"

import { useState, FormEvent } from "react"
import { getMessages, type Locale } from "@/lib/i18n"

interface TicketData {
  ticket_id: string
  passenger: { first_name: string; last_name: string }
  tariff: { name: string }
  valid_from: string
  valid_until: string
}

interface Props {
  initialLocale?: Locale
}

export default function OrderForm({ initialLocale = "en" }: Props) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const t = getMessages(locale)
  const isRtl = locale === "ar"
  const dir = isRtl ? "rtl" : "ltr"

  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">("form")
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [notGermany, setNotGermany] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = t.errors.firstName
    if (!lastName.trim()) errors.lastName = t.errors.lastName
    if (!birthDate) {
      errors.birthDate = t.errors.birthDate
    } else {
      const d = new Date(birthDate)
      if (isNaN(d.getTime())) errors.birthDate = t.errors.birthDateInvalid
      else {
        const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        if (age < 0 || age > 120) errors.birthDate = t.errors.birthDateRange
      }
    }
    if (!notGermany) {
      if (!postalCode.trim()) errors.postalCode = t.errors.postalCode
      else if (!/^\d{5}$/.test(postalCode.trim())) errors.postalCode = t.errors.postalCodeFormat
    }
    return errors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStep("submitting")

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, birthDate, postalCode, notGermany, language: locale }),
      })
      const data = await res.json()
      if (res.ok && data.status === "ticket_ready") {
        setTicket(data.ticketData)
        setStep("success")
      } else {
        setErrorMsg(data.error ?? t.errorTitle)
        setStep("error")
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.")
      setStep("error")
    }
  }

  const langSwitcher = (
    <button
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      style={styles.langBtn}
      data-testid="lang-switcher"
      type="button"
    >
      {t.switchLang}
    </button>
  )

  if (step === "submitting") {
    return (
      <div style={styles.center} dir={dir}>
        {langSwitcher}
        <p style={styles.lead}>{t.processing}</p>
        <div style={styles.spinner} />
      </div>
    )
  }

  if (step === "success" && ticket) {
    return (
      <div style={styles.card} id="ticket-success" dir={dir}>
        {langSwitcher}
        <h2 style={styles.successTitle}>{t.successTitle}</h2>
        <p style={styles.lead}>
          {ticket.passenger.first_name} {ticket.passenger.last_name}
        </p>
        <p>{ticket.tariff.name}</p>
        <p>
          {t.valid}: {ticket.valid_from} → {ticket.valid_until}
        </p>
        {/* Wallet integration is a placeholder for a future release */}
        <button style={styles.walletBtn} disabled data-testid="wallet-btn">
          {t.walletBtn}
        </button>
        <p style={styles.hint}>{t.walletHint}</p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div style={styles.card} dir={dir}>
        {langSwitcher}
        <h2 style={{ color: "#c00" }}>{t.errorTitle}</h2>
        <p>{errorMsg}</p>
        <button style={styles.btn} onClick={() => setStep("form")}>
          {t.tryAgain}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate dir={dir}>
      {langSwitcher}
      <h2 style={styles.formTitle}>{t.formTitle}</h2>
      <p style={styles.subtitle}>{t.formSubtitle}</p>

      <Field label={t.firstName} error={fieldErrors.firstName}>
        <input
          style={inputStyle(!!fieldErrors.firstName)}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
      </Field>

      <Field label={t.lastName} error={fieldErrors.lastName}>
        <input
          style={inputStyle(!!fieldErrors.lastName)}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
      </Field>

      <Field label={t.birthDate} error={fieldErrors.birthDate}>
        <input
          style={inputStyle(!!fieldErrors.birthDate)}
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>

      <Field label={t.postalCode} error={fieldErrors.postalCode}>
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
            data-testid="not-germany-checkbox"
          />{" "}
          {t.notGermany}
        </label>
      </Field>

      <button type="submit" style={styles.btn}>
        {t.submit}
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

function inputStyle(hasError: boolean): React.CSSProperties {
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
  langBtn: {
    float: "right",
    background: "none",
    border: "1px solid #ccc",
    borderRadius: 6,
    padding: "0.3rem 0.7rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
}
