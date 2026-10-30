import { Locator, Page } from '@playwright/test';

export type BillingAddress = {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
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
    // Country + postcode + house number trigger an address lookup that patches street/city/state,
    // so fill those first and let the lookup settle before typing the remaining fields.
    await this.page.getByTestId('country').selectOption({ label: address.country });
    await this.page.getByTestId('postal_code').fill(address.postalCode);
    await this.page.getByTestId('house_number').fill(address.houseNumber);
    await this.page.getByTestId('postcode-lookup-loading').waitFor({ state: 'hidden' });
    await this.page.getByTestId('street').fill(address.street);
    await this.page.getByTestId('city').fill(address.city);
    await this.page.getByTestId('state').fill(address.state);
  }

  async payWith(
    method:
      'bank-transfer' | 'cash-on-delivery' | 'credit-card' | 'buy-now-pay-later' | 'gift-card',
  ) {
    await this.paymentMethod.selectOption(method);
  }
}
