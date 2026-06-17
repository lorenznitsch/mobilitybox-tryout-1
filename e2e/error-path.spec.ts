import { test, expect } from "@playwright/test"

// Tests the mock-fail error path via a dedicated API route
// The /api/order-fail route forces MOBILITYBOX_MODE=mock-fail for this request
test("error screen shown when API fails (mock-fail)", async ({ page }) => {
  // Intercept /api/order and return an error response
  await page.route("/api/order", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ status: "error", error: "Mobilitybox API error (simulated)" }),
    })
  })

  await page.goto("/order")
  await page.fill('input[autocomplete="given-name"]', "Error")
  await page.fill('input[autocomplete="family-name"]', "Test")
  await page.fill('input[type="date"]', "1990-01-01")
  await page.fill('input[placeholder="10115"]', "12345")
  await page.click('button[type="submit"]')

  await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 5000 })
  await expect(page.getByText("Mobilitybox API error (simulated)")).toBeVisible()
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible()
})

test("not-germany path: checkbox disables postal code and order succeeds", async ({ page }) => {
  await page.goto("/order")
  await page.fill('input[autocomplete="given-name"]', "Ahmed")
  await page.fill('input[autocomplete="family-name"]', "Khalil")
  await page.fill('input[type="date"]', "1988-05-10")

  // Check "not Germany"
  await page.getByTestId("not-germany-checkbox").check()
  // Postal code input should be disabled
  const postalInput = page.locator('input[placeholder="10115"]')
  await expect(postalInput).toBeDisabled()

  await page.click('button[type="submit"]')
  await expect(page.locator("#ticket-success")).toBeVisible({ timeout: 10000 })
})
