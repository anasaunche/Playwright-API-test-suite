import { test as setup, expect } from '../../src/fixtures';
import { AUTH_STATE_FILE, env } from '../../src/config/env';

/**
 * Logs in through the real UI once and saves the browser storage state, so specs that
 * need an authenticated customer start already signed in.
 */
setup('authenticate as demo customer', async ({ page, loginPage, header }) => {
  // Record failing API calls so that a failure here explains itself in the CI log.
  const failedCalls: string[] = [];
  page.on('response', (res) => {
    if (res.status() >= 400)
      failedCalls.push(`${res.status()} ${res.request().method()} ${res.url()}`);
  });

  await loginPage.goto();
  await loginPage.login(env.customer.email, env.customer.password);

  try {
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByTestId('page-title')).toHaveText(/my account/i);
    await expect(header.userMenu).toContainText(env.customer.fullName);
  } catch (error) {
    const body = await page
      .locator('body')
      .innerText()
      .catch(() => '<no body>');
    throw new Error(
      `${(error as Error).message}\n` +
        `URL: ${page.url()}\nFailed calls:\n  ${failedCalls.join('\n  ') || '(none)'}\n` +
        `Page text: ${body.replace(/\s+/g, ' ').slice(0, 800)}`,
      { cause: error },
    );
  }

  await page.context().storageState({ path: AUTH_STATE_FILE });
});
