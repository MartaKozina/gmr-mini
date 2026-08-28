# E2E Testing Rules

- Use `getByRole`, `getByLabel`, `getByText` as primary locators. Fall back to
  `getByPlaceholder` only where the DOM genuinely has no accessible label (a
  real, pre-existing gap in this app's form inputs — see Known gaps below);
  use `getByTestId` only when even that's ambiguous.
- Never use CSS selectors, XPath, or DOM structure for locating elements.
- Each test must be independently runnable — no shared state between tests.
- Never use `page.waitForTimeout()`. Wait for specific conditions:
  `toBeVisible()`, `waitForURL()`, `waitForResponse()`.
- Assert the business outcome, not implementation details.
- Use unique identifiers (e.g., a `Date.now()` suffix) for test data to avoid
  collisions in parallel runs. Clean up within the test (this app has no
  `afterEach` hook wired for DB cleanup — each test deletes what it created).
- Use `storageState` for authentication — never log in through the UI. This
  app only has real Google OAuth, which can't be driven headlessly, so
  `tests/e2e/global-setup.ts` seeds a test user + a database-session row
  directly and writes the `authjs.session-token` cookie into
  `tests/e2e/.auth/user.json`. Every test starts already authenticated.
- Destructive UI actions (pet/recipe delete) use `window.confirm()` — register
  `page.on("dialog", (d) => d.accept())` before triggering them, or Playwright
  auto-dismisses the dialog and the action silently no-ops.

## Known gaps this surfaced

- The pet-creation form's text/number inputs (`Dog's name`, `Weight (kg)`)
  have no `<label>`/`aria-label` — only a `placeholder`, which is not an
  accessible name. `getByPlaceholder` is used here as the closest legitimate
  fallback, but the underlying gap is a real accessibility issue worth fixing
  independently of E2E test authoring.
