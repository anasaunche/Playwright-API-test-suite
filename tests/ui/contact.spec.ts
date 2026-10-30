import { test, expect } from '../../src/fixtures';

const validMessage = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada.lovelace@example.com',
  subject: 'Customer service',
  message:
    'Hello! This is an automated Playwright test message. Please ignore it – it is only used to verify the contact form.',
};

test.describe('Contact form', { tag: '@ui' }, () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.goto();
  });

  test('guest can send a message', async ({ contactPage }) => {
    await contactPage.fillForm(validMessage);
    await contactPage.submit.click();

    await expect(contactPage.success).toBeVisible();
  });

  test('message shorter than 50 characters is rejected', async ({ contactPage }) => {
    await contactPage.fillForm({ ...validMessage, message: 'Too short.' });
    await contactPage.submit.click();

    await expect(contactPage.error('message')).toContainText(/50/);
    await expect(contactPage.success).toBeHidden();
  });

  test('empty form flags every required field', async ({ contactPage }) => {
    await contactPage.submit.click();

    for (const field of ['first-name', 'last-name', 'email', 'subject', 'message'] as const) {
      await expect.soft(contactPage.error(field), field).toBeVisible();
    }
  });
});
