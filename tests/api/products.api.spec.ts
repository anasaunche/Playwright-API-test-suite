import { test, expect } from '../../src/fixtures';

test.describe('Products API', { tag: '@api' }, () => {
  test('lists products with a valid paginated contract', { tag: '@smoke' }, async ({ api }) => {
    const page = await api.getProducts();

    expect(page.current_page).toBe(1);
    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data.length).toBeLessThanOrEqual(page.per_page);
    expect(page.total).toBeGreaterThanOrEqual(page.data.length);
  });

  test('pages do not overlap', async ({ api }) => {
    const first = await api.getProducts({ page: 1 });
    test.skip(first.last_page < 2, 'catalogue has a single page');

    const second = await api.getProducts({ page: 2 });
    const firstIds = new Set(first.data.map((p) => p.id));

    expect(second.current_page).toBe(2);
    expect(second.data.some((p) => firstIds.has(p.id))).toBe(false);
  });

  for (const direction of ['asc', 'desc'] as const) {
    test(`sorts by price ${direction}`, async ({ api }) => {
      const { data } = await api.getProducts({ sort: `price,${direction}` });
      const prices = data.map((p) => p.price);
      const expected = [...prices].sort((a, b) => (direction === 'asc' ? a - b : b - a));

      expect(prices).toEqual(expected);
    });

    test(`sorts by name ${direction}`, async ({ api }) => {
      const { data } = await api.getProducts({ sort: `name,${direction}` });
      const names = data.map((p) => p.name.toLowerCase());
      const expected = [...names].sort((a, b) =>
        direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
      );

      expect(names).toEqual(expected);
    });
  }

  test('filters by price range', async ({ api }) => {
    const { data } = await api.getProducts({ between: 'price,10,30' });

    expect(data.length).toBeGreaterThan(0);
    for (const product of data) {
      expect.soft(product.price, product.name).toBeGreaterThanOrEqual(10);
      expect.soft(product.price, product.name).toBeLessThanOrEqual(30);
    }
  });

  test('filters by category', async ({ api }) => {
    const { data } = await api.getProducts();
    const category = data.find((p) => p.category)?.category;
    test.skip(!category, 'products do not expose their category');

    const filtered = await api.getProducts({ by_category: category!.id });

    expect(filtered.data.length).toBeGreaterThan(0);
    for (const product of filtered.data) {
      expect.soft(product.category?.id, product.name).toBe(category!.id);
    }
  });

  test('search returns only matching products', { tag: '@smoke' }, async ({ api }) => {
    const { data } = await api.searchProducts('pliers');

    expect(data.length).toBeGreaterThan(0);
    for (const product of data) {
      expect.soft(`${product.name} ${product.description}`.toLowerCase()).toContain('pliers');
    }
  });

  test('search with no match returns an empty page', async ({ api }) => {
    const page = await api.searchProducts('zzz-no-such-product-zzz');

    expect(page.total).toBe(0);
    expect(page.data).toEqual([]);
  });

  test('product detail matches the list entry', async ({ api }) => {
    const { data } = await api.getProducts();
    const listed = data[0]!;

    const detail = await api.getProduct(listed.id);

    expect(detail).toMatchObject({ id: listed.id, name: listed.name, price: listed.price });
  });

  test('unknown product returns 404', async ({ api }) => {
    const res = await api.product('01NONEXISTENTPRODUCT00000');
    expect(res.status()).toBe(404);
  });
});

test.describe('Catalogue reference data', { tag: '@api' }, () => {
  test('categories have unique slugs', async ({ api }) => {
    const categories = await api.getCategories();
    const slugs = categories.map((c) => c.slug);

    expect(categories.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
