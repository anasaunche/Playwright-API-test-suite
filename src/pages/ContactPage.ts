import { Locator, Page } from '@playwright/test';

export type ContactMessage = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

export class ContactPage {
  readonly submit: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.submit = page.getByTestId('contact-submit');
    this.success = page.getByText(/Thanks for your message/i);
  }

  async goto() {
    await this.page.goto('/contact');
  }

  async fillForm(msg: ContactMessage) {
    await this.page.getByTestId('first-name').fill(msg.firstName);
    await this.page.getByTestId('last-name').fill(msg.lastName);
    await this.page.getByTestId('email').fill(msg.email);
    await this.page.getByTestId('subject').selectOption({ label: msg.subject });
    await this.page.getByTestId('message').fill(msg.message);
  }

  error(field: 'first-name' | 'last-name' | 'email' | 'subject' | 'message') {
    return this.page.getByTestId(`${field}-error`);
  }
}
