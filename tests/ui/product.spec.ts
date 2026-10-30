import { test, expect } from '../../src/fixtures';
import type { Product } from '../../src/api/schemas';

test.describe('Product detail', { tag: '@ui' }, () => {
  let product: Product;

  // Test data comes from the API rather than hard-coded ids, which change when the demo reseeds.
  test.beforeEach(async ({ api, productPage }) => {
    product = await api.getPurchasableProduct();
    await productPage.goto(product.id);
  });

  test('shows the same name and price as the API', async ({ productPage }) => {
    await expect(productPage.name).toHaveText(product.name);
    expect(await productPage.price()).toBeCloseTo(product.price, 2);
  });

  test(
    'adding to cart updates the cart badge',
    { tag: '@smoke' },
    async ({ productPage, header }) => {
      await expect(header.cartQuantity).toBeHidden();

      await productPage.add(1);

      await expect(productPage.toast).toBeVisible();
      await expect(header.cartQuantity).toHaveText('1');
    },
  );

  test('chosen quantity is carried to the cart with the correct line total', async ({
    productPage,
    header,
    checkoutPage,
  }) => {
    await productPage.add(3);
    await expect(header.cartQuantity).toHaveText('3');

    await header.cartLink.click();

    const line = checkoutPage.lineItem(product.name);
    await expect(line.quantity).toHaveValue('3');
    await expect(line.linePrice).toContainText((product.price * 3).toFixed(2));
    await expect(checkoutPage.cartTotal).toContainText((product.price * 3).toFixed(2));
  });
});
