import en from "./en.json"
import ar from "./ar.json"

export type Locale = "en" | "ar"
export type Messages = typeof en

export const messages: Record<Locale, Messages> = { en, ar }

export const locales: Locale[] = ["en", "ar"]

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en
}
