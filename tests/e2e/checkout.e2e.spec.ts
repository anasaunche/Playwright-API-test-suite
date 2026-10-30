import { test, expect } from '../../src/fixtures';

/**
 * Full purchase journey as a signed-in customer (storage state from the setup project).
 * The cart lives in sessionStorage, so every test starts with an empty cart.
 */
test.describe('Checkout', { tag: ['@e2e', '@smoke'] }, () => {
  test('signed-in customer can buy a product', async ({
    api,
    productPage,
    header,
    checkoutPage,
  }) => {
    const product = await api.getPurchasableProduct();

    await test.step('add product to cart', async () => {
      await productPage.goto(product.id);
      await productPage.add(2);
      await expect(header.cartQuantity).toHaveText('2');
    });

    await test.step('review cart', async () => {
      await header.cartLink.click();
      await expect(checkoutPage.lineItem(product.name).row).toBeVisible();
      await expect(checkoutPage.cartTotal).toContainText((product.price * 2).toFixed(2));
      await checkoutPage.proceedFromCart.click();
    });

    await test.step('already signed in', async () => {
      await expect(checkoutPage.proceedFromSignIn).toBeEnabled();
      await checkoutPage.proceedFromSignIn.click();
    });

    await test.step('billing address', async () => {
      await checkoutPage.fillBillingAddress({
        country: 'Netherlands',
        postalCode: '1012JS',
        houseNumber: '1',
        street: 'Dam',
        city: 'Amsterdam',
        state: 'Noord-Holland',
      });
      await expect(checkoutPage.proceedFromAddress).toBeEnabled();
      await checkoutPage.proceedFromAddress.click();
    });

    await test.step('pay and confirm', async () => {
      await checkoutPage.payWith('cash-on-delivery');
      await checkoutPage.confirm.click();
      await expect(checkoutPage.paymentSuccess).toBeVisible();

      await checkoutPage.confirm.click();
      await expect(checkoutPage.orderConfirmation).toBeVisible();
      await expect(checkoutPage.orderConfirmation).toContainText(/INV-\d+/);
    });
  });
});
