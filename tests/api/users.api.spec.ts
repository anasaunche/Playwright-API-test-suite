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

  test('rejects a duplicate email', async ({ api }) => {
    const customer = newCustomer();
    expect((await api.register(customer)).status()).toBe(201);

    const res = await api.register({ ...customer, first_name: 'Duplicate' });

    expect(res.status()).toBe(422);
    expect(JSON.stringify(await res.json())).toContain('email');
  });

  test('rejects an invalid payload with field errors', async ({ api }) => {
    const res = await api.register(newCustomer({ email: 'not-an-email', password: 'short' }));

    expect(res.status()).toBe(422);
    const body = JSON.stringify(await res.json());
    expect(body).toContain('email');
    expect(body).toContain('password');
  });
});
