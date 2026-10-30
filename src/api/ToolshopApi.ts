import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { z } from 'zod';
import {
  CartSchema,
  CategorySchema,
  LoginResponseSchema,
  ProductPageSchema,
  ProductSchema,
  UserSchema,
} from './schemas';

export type ProductQuery = {
  page?: number;
  sort?: `${'name' | 'price'},${'asc' | 'desc'}`;
  by_category?: string | number;
  by_brand?: string | number;
  between?: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
  address: { street: string; city: string; state: string; country: string; postal_code: string };
};

/**
 * Thin, typed client around the Toolshop REST API.
 *
 * Methods prefixed with `get`/`create`/… assert a successful status and return a
 * schema-validated body. Raw `request` access stays available for negative tests.
 */
export class ToolshopApi {
  constructor(
    readonly request: APIRequestContext,
    private token?: string,
  ) {}

  get bearerToken(): string | undefined {
    return this.token;
  }

  get authHeaders(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  withToken(token: string): ToolshopApi {
    return new ToolshopApi(this.request, token);
  }

  // ---- auth / users -------------------------------------------------------

  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/users/login', { data: { email, password } });
  }

  async loginAs(email: string, password: string): Promise<ToolshopApi> {
    const body = await this.parse(await this.login(email, password), LoginResponseSchema);
    return this.withToken(body.access_token);
  }

  me(): Promise<APIResponse> {
    return this.request.get('/users/me', { headers: this.authHeaders });
  }

  async getMe() {
    return this.parse(await this.me(), UserSchema);
  }

  register(payload: RegisterPayload): Promise<APIResponse> {
    return this.request.post('/users/register', { data: payload });
  }

  // ---- catalogue ----------------------------------------------------------

  async getProducts(query: ProductQuery = {}) {
    const res = await this.request.get('/products', { params: query });
    return this.parse(res, ProductPageSchema);
  }

  async searchProducts(q: string, page = 1) {
    const res = await this.request.get('/products/search', { params: { q, page } });
    return this.parse(res, ProductPageSchema);
  }

  product(id: string | number): Promise<APIResponse> {
    return this.request.get(`/products/${id}`);
  }

  async getProduct(id: string | number) {
    return this.parse(await this.product(id), ProductSchema);
  }

  async getCategories() {
    return this.parse(await this.request.get('/categories'), z.array(CategorySchema));
  }

  /** First product on the first page that can actually be bought. */
  async getPurchasableProduct() {
    const { data } = await this.getProducts();
    const product = data.find((p) => p.in_stock !== false && !p.is_rental);
    expect(product, 'expected at least one in-stock, non-rental product').toBeDefined();
    return product!;
  }

  // ---- cart ---------------------------------------------------------------

  async createCart(): Promise<string | number> {
    const res = await this.request.post('/carts');
    expect(res.status(), await res.text()).toBe(201);
    return z.object({ id: z.union([z.string(), z.number()]) }).parse(await res.json()).id;
  }

  addToCart(cartId: string | number, productId: string | number, quantity = 1) {
    return this.request.post(`/carts/${cartId}`, {
      data: { product_id: productId, quantity },
    });
  }

  updateCartQuantity(cartId: string | number, productId: string | number, quantity: number) {
    return this.request.put(`/carts/${cartId}/product/quantity`, {
      data: { product_id: productId, quantity },
    });
  }

  removeFromCart(cartId: string | number, productId: string | number) {
    return this.request.delete(`/carts/${cartId}/product/${productId}`);
  }

  cart(cartId: string | number): Promise<APIResponse> {
    return this.request.get(`/carts/${cartId}`);
  }

  async getCart(cartId: string | number) {
    return this.parse(await this.cart(cartId), CartSchema);
  }

  deleteCart(cartId: string | number) {
    return this.request.delete(`/carts/${cartId}`);
  }

  // ---- helpers ------------------------------------------------------------

  /** Asserts a 2xx response and validates the JSON body against `schema`. */
  async parse<T extends z.ZodTypeAny>(res: APIResponse, schema: T): Promise<z.infer<T>> {
    const url = res.url();
    expect(res.ok(), `${res.status()} from ${url}: ${await res.text()}`).toBe(true);
    const result = schema.safeParse(await res.json());
    if (!result.success) {
      throw new Error(`Response from ${url} violates contract:\n${result.error.toString()}`);
    }
    return result.data;
  }
}
