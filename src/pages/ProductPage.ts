import { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly quantity: Locator;
  readonly increaseQuantity: Locator;
  readonly addToCart: Locator;
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.addToCart = page.getByTestId('add-to-cart');
    this.toast = page.getByRole('alert').filter({ hasText: 'Product added to shopping cart' });
  }

  async goto(productId: string | number) {
    await this.page.goto(`/product/${productId}`);
  }

  async price(): Promise<number> {
    return Number((await this.unitPrice.innerText()).replace(/[^\d.]/g, ''));
  }

  async add(quantity = 1) {
    await this.quantity.fill(String(quantity));
    await this.addToCart.click();
  }
}
