import { test, expect } from '../../src/fixtures';
import { UserSchema } from '../../src/api/schemas';
import { newCustomer } from '../../src/data/factories';

test.describe('User registration API', { tag: '@api' }, () => {
  test('registers a new customer who can then log in', async ({ api }) => {
    const customer = newCustomer();

    const created = await test.step('register', async () => {
      const res = await api.register(customer);
      expect(res.status(), await res.text()).toBe(201);
      return UserSchema.parse(await res.json());
    });

    expect(created.email).toBe(customer.email);

    await test.step('log in with the new account', async () => {
      const authed = await api.loginAs(customer.email, customer.password);
      const me = await authed.getMe();
      expect(me).toMatchObject({
        id: created.id,
        email: customer.email,
        first_name: customer.first_name,
      });
    });
  });

  test('rejects a duplicate email with 409 Conflict', async ({ api }) => {
    const customer = newCustomer();
    expect((await api.register(customer)).status()).toBe(201);

    const res = await api.register({ ...customer, first_name: 'Duplicate' });

    expect(res.status()).toBe(409);
    expect(JSON.stringify(await res.json())).toContain('email');
  });

  test('enforces the password policy', async ({ api }) => {
    const res = await api.register(newCustomer({ password: 'short' }));

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.password).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at least 8 characters/i),
        expect.stringMatching(/uppercase and one lowercase/i),
        expect.stringMatching(/symbol/i),
        expect.stringMatching(/number/i),
      ]),
    );
  });

  // Note: the API only checks that email is present and unique, not its format.
  test('requires an email address', async ({ api }) => {
    const res = await api.register(newCustomer({ email: '' }));

    expect(res.status()).toBe(422);
    expect(await res.json()).toHaveProperty('email');
  });
});
