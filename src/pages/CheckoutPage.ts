import { Locator, Page } from '@playwright/test';

export type BillingAddress = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

/** Multi-step checkout wizard: cart → sign in → billing address → payment. */
export class CheckoutPage {
  readonly lineItems: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCart: Locator;
  readonly proceedFromSignIn: Locator;
  readonly proceedFromAddress: Locator;
  readonly paymentMethod: Locator;
  readonly confirm: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.lineItems = page.locator('tbody tr').filter({ has: page.getByTestId('product-title') });
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCart = page.getByTestId('proceed-1');
    this.proceedFromSignIn = page.getByTestId('proceed-2');
    this.proceedFromAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.confirm = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.getByText(/Thanks for your order/i);
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  lineItem(productName: string) {
    const row = this.lineItems.filter({ hasText: productName });
    return {
      row,
      quantity: row.getByTestId('product-quantity'),
      linePrice: row.getByTestId('line-price'),
    };
  }

  async fillBillingAddress(address: BillingAddress) {
    await this.page.getByTestId('street').fill(address.street);
    await this.page.getByTestId('city').fill(address.city);
    await this.page.getByTestId('state').fill(address.state);
    await this.fillCountry(address.country);
    // Field was renamed from "postcode" to "postal_code" between app versions.
    await this.page
      .getByTestId('postal_code')
      .or(this.page.getByTestId('postcode'))
      .fill(address.postalCode);
  }

  private async fillCountry(country: string) {
    const field = this.page.getByTestId('country');
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') {
      await field.selectOption({ label: country });
    } else {
      await field.fill(country);
    }
  }

  async payWith(method: string) {
    await this.paymentMethod.selectOption(method);
  }
}
