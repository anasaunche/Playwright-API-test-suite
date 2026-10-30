import { test, expect } from '../../src/fixtures';
import { env } from '../../src/config/env';
import { uniqueEmail } from '../../src/data/factories';

test.describe('Login', { tag: '@ui' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'customer can sign in and sign out',
    { tag: '@smoke' },
    async ({ page, loginPage, header }) => {
      await loginPage.login(env.customer.email, env.customer.password);

      await expect(page).toHaveURL(/\/account/);
      await expect(page.getByTestId('page-title')).toHaveText(/my account/i);
      await expect(header.userMenu).toContainText(env.customer.fullName);

      // Signing out invalidates the token server-side, which is why this test uses its own
      // session instead of the shared storage state.
      await header.signOut();
      await expect(header.signInLink).toBeVisible();
      await expect(header.userMenu).toBeHidden();
    },
  );

  test('unknown credentials show an error', async ({ page, loginPage }) => {
    await loginPage.login(uniqueEmail('nobody'), 'NotTheRightPassword1!');

    await expect(loginPage.loginError).toHaveText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('empty form shows required-field validation', async ({ loginPage }) => {
    await loginPage.submit.click();

    await expect(loginPage.emailError).toHaveText(/required/i);
    await expect(loginPage.passwordError).toHaveText(/required/i);
  });

  test('malformed email is flagged', async ({ loginPage }) => {
    await loginPage.login('not-an-email', 'whatever123');

    await expect(loginPage.emailError).toBeVisible();
  });
});

test.describe('Authenticated session', { tag: '@ui' }, () => {
  test.use({ signedIn: true });

  test('signed-in customer can open their account page', async ({ page, header }) => {
    await page.goto('/account');

    await expect(page.getByTestId('page-title')).toHaveText(/my account/i);
    await expect(header.userMenu).toContainText(env.customer.fullName);
  });
});
