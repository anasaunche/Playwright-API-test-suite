import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import { ToolshopApi } from '../api/ToolshopApi';
import { AUTH_TOKEN_STORAGE_KEY, env } from '../config/env';
import { CatalogPage } from '../pages/CatalogPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { Header } from '../pages/Header';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';

type TestOptions = {
  /**
   * Start the test signed in as the demo customer. A fresh API token is injected into
   * localStorage before the app boots: faster than a UI login, and immune to the API's
   * short (5 min) token lifetime that would make a saved storage state go stale.
   */
  signedIn: boolean;
};

type TestFixtures = {
  /** Anonymous API client. */
  api: ToolshopApi;
  /** API client authenticated as the demo customer (token shared per worker). */
  customerApi: ToolshopApi;
  header: Header;
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  checkoutPage: CheckoutPage;
  contactPage: ContactPage;
};

type WorkerFixtures = {
  customerToken: string;
};

export const test = base.extend<TestOptions & TestFixtures, WorkerFixtures>({
  signedIn: [false, { option: true }],

  // Logging in once per worker keeps the suite fast and gentle on the demo's rate limits.
  customerToken: [
    async ({}, use) => {
      const ctx = await playwrightRequest.newContext({ baseURL: env.apiUrl });
      const api = await new ToolshopApi(ctx).loginAs(env.customer.email, env.customer.password);
      await use(api.bearerToken!);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  // A dedicated API context so UI projects (whose baseURL is the web app) can call the API too.
  api: async ({}, use) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(new ToolshopApi(ctx));
    await ctx.dispose();
  },

  customerApi: async ({ api, customerToken }, use) => {
    await use(api.withToken(customerToken));
  },

  context: async ({ context, signedIn, api }, use) => {
    if (signedIn) {
      const customer = await api.loginAs(env.customer.email, env.customer.password);
      await context.addInitScript(([key, token]) => window.localStorage.setItem(key, token), [
        AUTH_TOKEN_STORAGE_KEY,
        customer.bearerToken!,
      ] as const);
    }
    await use(context);
  },

  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),
});

export { expect };
