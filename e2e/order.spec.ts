import { test, expect } from "@playwright/test"

test("order form: fill in details and see success screen (mock mode)", async ({ page }) => {
  await page.goto("/order")

  // Fill in the form
  await page.fill('input[autocomplete="given-name"]', "Erika")
  await page.fill('input[autocomplete="family-name"]', "Musterfrau")
  await page.fill('input[type="date"]', "1985-06-15")
  await page.fill('input[placeholder="10115"]', "10115")

  // Submit
  await page.click('button[type="submit"]')

  // Wait for success
  await expect(page.locator("#ticket-success")).toBeVisible({ timeout: 10000 })
  await expect(page.getByText("Your Deutschlandticket is ready!")).toBeVisible()
  await expect(page.getByText("Erika Musterfrau")).toBeVisible()
})
