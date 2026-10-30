import { test as setup, expect } from '../../src/fixtures';
import { AUTH_STATE_FILE, env } from '../../src/config/env';

/**
 * Logs in through the real UI once and saves the browser storage state, so specs that
 * need an authenticated customer start already signed in.
 */
setup('authenticate as demo customer', async ({ page, loginPage, header }) => {
  // The header only shows the user menu once GET /users/me succeeds – record those calls
  // so a failure here explains itself.
  const profileCalls: string[] = [];
  page.on('response', (res) => {
    if (new URL(res.url()).pathname.endsWith('/users/me')) profileCalls.push(String(res.status()));
  });

  await loginPage.goto();
  await loginPage.login(env.customer.email, env.customer.password);

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByTestId('page-title')).toHaveText(/my account/i);

  try {
    await expect(header.userMenu).toContainText(env.customer.fullName);
  } catch (error) {
    const nav = await page
      .locator('nav')
      .first()
      .innerText()
      .catch(() => '<no nav>');
    throw new Error(
      `${(error as Error).message}\n` +
        `URL: ${page.url()}\n/users/me statuses: [${profileCalls.join(', ')}]\n` +
        `Header text: ${nav.replace(/\s+/g, ' ').slice(0, 500)}`,
      { cause: error },
    );
  }

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
