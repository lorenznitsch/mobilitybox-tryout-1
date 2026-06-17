import { test, expect } from "@playwright/test"

test("success screen shows ticket data and wallet placeholder button", async ({ page }) => {
  await page.goto("/order")

  await page.fill('input[autocomplete="given-name"]', "Lena")
  await page.fill('input[autocomplete="family-name"]', "Test")
  await page.fill('input[type="date"]', "1992-03-20")
  await page.fill('input[placeholder="10115"]', "80331")

  await page.click('button[type="submit"]')

  await expect(page.locator("#ticket-success")).toBeVisible({ timeout: 10000 })

  // Ticket data visible
  await expect(page.getByText("Your Deutschlandticket is ready!")).toBeVisible()
  await expect(page.getByText(/Lena Test/)).toBeVisible()
  await expect(page.getByText("Deutschlandticket", { exact: true })).toBeVisible()

  // Wallet button visible but disabled (placeholder)
  const walletBtn = page.getByTestId("wallet-btn")
  await expect(walletBtn).toBeVisible()
  await expect(walletBtn).toBeDisabled()
})
