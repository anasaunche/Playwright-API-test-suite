import { test as setup, expect } from '../../src/fixtures';
import { AUTH_STATE_FILE, env } from '../../src/config/env';

/**
 * Logs in through the real UI once and saves the browser storage state, so specs that
 * need an authenticated customer start already signed in.
 */
setup('authenticate as demo customer', async ({ page, loginPage, header }) => {
  await loginPage.goto();
  await loginPage.login(env.customer.email, env.customer.password);

  await expect(page).toHaveURL(/\/account/);
  await expect(header.userMenu).toContainText(env.customer.fullName);

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
