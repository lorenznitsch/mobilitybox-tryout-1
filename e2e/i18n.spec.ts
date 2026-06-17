import { test, expect } from "@playwright/test"

test("EN: order page shows English text by default", async ({ page }) => {
  await page.goto("/order")
  await expect(page.getByText("Order your Deutschlandticket")).toBeVisible()
  // dir attribute should be ltr (or absent)
  const form = page.locator("form")
  const dir = await form.getAttribute("dir")
  expect(dir).toBe("ltr")
})

test("AR: switching to Arabic shows Arabic text and sets dir=rtl", async ({ page }) => {
  await page.goto("/order")

  // Switch to Arabic
  await page.getByTestId("lang-switcher").click()

  // Key Arabic text visible
  await expect(page.getByText("اطلب تذكرة ألمانيا")).toBeVisible()

  // dir=rtl on the form
  const form = page.locator("form")
  const dir = await form.getAttribute("dir")
  expect(dir).toBe("rtl")
})
