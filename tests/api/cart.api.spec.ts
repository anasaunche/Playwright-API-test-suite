import { test, expect } from '../../src/fixtures';
import type { Product } from '../../src/api/schemas';

test.describe('Cart API', { tag: '@api' }, () => {
  let cartId: string | number;
  let product: Product;

  test.beforeEach(async ({ api }) => {
    product = await api.getPurchasableProduct();
    cartId = await api.createCart();
  });

  test.afterEach(async ({ api }) => {
    await api.deleteCart(cartId);
  });

  test('a new cart is empty', async ({ api }) => {
    const cart = await api.getCart(cartId);

    expect(cart.id).toBe(cartId);
    expect(cart.cart_items).toHaveLength(0);
  });

  test('add, update and remove an item', { tag: '@smoke' }, async ({ api }) => {
    await test.step('add item', async () => {
      const res = await api.addToCart(cartId, product.id, 2);
      expect(res.ok(), await res.text()).toBe(true);

      const cart = await api.getCart(cartId);
      expect(cart.cart_items).toEqual([
        expect.objectContaining({ product_id: product.id, quantity: 2 }),
      ]);
    });

    await test.step('update quantity', async () => {
      const res = await api.updateCartQuantity(cartId, product.id, 5);
      expect(res.ok(), await res.text()).toBe(true);

      const cart = await api.getCart(cartId);
      expect(cart.cart_items[0]?.quantity).toBe(5);
    });

    await test.step('remove item', async () => {
      const res = await api.removeFromCart(cartId, product.id);
      expect(res.status()).toBe(204);

      const cart = await api.getCart(cartId);
      expect(cart.cart_items).toHaveLength(0);
    });
  });

  test('adding the same product twice accumulates quantity', async ({ api }) => {
    await api.addToCart(cartId, product.id, 1);
    await api.addToCart(cartId, product.id, 3);

    const cart = await api.getCart(cartId);
    expect(cart.cart_items).toHaveLength(1);
    expect(cart.cart_items[0]?.quantity).toBe(4);
  });

  test('a deleted cart is gone', async ({ api }) => {
    expect((await api.deleteCart(cartId)).status()).toBe(204);
    expect((await api.cart(cartId)).status()).toBe(404);
  });
});
