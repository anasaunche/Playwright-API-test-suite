import { test, expect } from '../../src/fixtures';

test.describe('Product catalogue', { tag: '@ui' }, () => {
  test.beforeEach(async ({ catalogPage }) => {
    await catalogPage.goto();
  });

  test('home page shows a grid of products', { tag: '@smoke' }, async ({ catalogPage }) => {
    await expect(catalogPage.productCards.first()).toBeVisible();
    expect(await catalogPage.productCards.count()).toBeGreaterThan(0);
    await expect(catalogPage.productPrices.first()).toHaveText(/\$\d+\.\d{2}/);
  });

  test(
    'search narrows results to matching products',
    { tag: '@smoke' },
    async ({ catalogPage }) => {
      await catalogPage.search('pliers');

      await expect(catalogPage.searchCaption).toContainText('pliers');
      const names = await catalogPage.names();
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect.soft(name.toLowerCase()).toContain('pliers');
    },
  );

  test('search without matches shows an empty state', async ({ catalogPage }) => {
    await catalogPage.search('zzz-no-such-product-zzz');

    await expect(catalogPage.noResults).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(0);
  });

  test('sort by price low → high', async ({ catalogPage }) => {
    await catalogPage.sortBy('price,asc');

    const prices = await catalogPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sort by price high → low', async ({ catalogPage }) => {
    await catalogPage.sortBy('price,desc');

    const prices = await catalogPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('sort by name Z → A', async ({ catalogPage }) => {
    await catalogPage.sortBy('name,desc');

    const names = (await catalogPage.names()).map((n) => n.toLowerCase());
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('category filter shows only that category', async ({ catalogPage }) => {
    await catalogPage.filterByCategory('Hammer');

    const names = await catalogPage.names();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect.soft(name.toLowerCase()).toContain('hammer');
  });
});
