import { test, expect } from '../../src/fixtures';

/** Cross-layer checks: what the UI renders must agree with what the API returns. */
test.describe('UI ↔ API consistency', { tag: '@e2e' }, () => {
  test('search results in the UI match the search API', async ({ api, catalogPage }) => {
    const term = 'hammer';
    const fromApi = await api.searchProducts(term);

    await catalogPage.goto();
    await catalogPage.search(term);

    await expect(catalogPage.productNames).toHaveCount(fromApi.data.length);
    expect((await catalogPage.names()).sort()).toEqual(fromApi.data.map((p) => p.name).sort());
  });

  test('items added via the UI land in the API cart', async ({
    page,
    api,
    productPage,
    header,
  }) => {
    const product = await api.getPurchasableProduct();

    await productPage.goto(product.id);
    const cartCreated = page.waitForResponse(
      (res) => res.request().method() === 'POST' && /\/carts$/.test(new URL(res.url()).pathname),
    );
    await productPage.add(2);
    await expect(header.cartQuantity).toHaveText('2');

    const { id: cartId } = await (await cartCreated).json();
    const cart = await api.getCart(cartId);
    expect(cart.cart_items).toEqual([
      expect.objectContaining({ product_id: product.id, quantity: 2 }),
    ]);
  });
});
