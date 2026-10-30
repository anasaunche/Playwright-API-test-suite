import { Locator, Page, Response } from '@playwright/test';

export type SortOption = 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc';

/** The home page: product grid with search, sort and category filters. */
export class CatalogPage {
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly searchCaption: Locator;
  readonly sortSelect: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly noResults: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchCaption = page.getByTestId('search-caption');
    this.sortSelect = page.getByTestId('sort');
    this.productCards = page.locator('a.card[data-test^="product-"]');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.noResults = page.getByText('There are no products found.');
  }

  async goto() {
    const loaded = this.waitForProducts();
    await this.page.goto('/');
    await loaded;
  }

  /**
   * The grid is rendered from XHR calls to the API; waiting on the response (instead of
   * arbitrary timeouts) keeps the tests deterministic.
   */
  waitForProducts(predicate: (url: URL) => boolean = () => true): Promise<Response> {
    return this.page.waitForResponse((res) => {
      const url = new URL(res.url());
      return /\/products(\/search)?$/.test(url.pathname) && res.ok() && predicate(url);
    });
  }

  async search(term: string) {
    const results = this.waitForProducts((url) => url.searchParams.get('q') === term);
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
    await results;
  }

  async sortBy(option: SortOption) {
    const sorted = this.waitForProducts((url) => url.searchParams.get('sort') === option);
    await this.sortSelect.selectOption(option);
    await sorted;
  }

  async filterByCategory(name: string) {
    const filtered = this.waitForProducts((url) => url.searchParams.has('by_category'));
    await this.page.getByLabel(name, { exact: true }).check();
    await filtered;
  }

  async names(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((n) => n.trim());
  }

  async prices(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map((p) => Number(p.replace(/[^\d.]/g, '')));
  }

  async openProduct(name: string) {
    await this.productNames.filter({ hasText: name }).first().click();
  }
}
