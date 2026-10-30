import { test, expect } from '../../src/fixtures';
import { env } from '../../src/config/env';
import { LoginResponseSchema } from '../../src/api/schemas';
import { uniqueEmail } from '../../src/data/factories';

test.describe('Auth API', { tag: '@api' }, () => {
  test('valid credentials return a bearer token', { tag: '@smoke' }, async ({ api }) => {
    const res = await api.login(env.customer.email, env.customer.password);

    expect(res.status()).toBe(200);
    const body = LoginResponseSchema.parse(await res.json());
    expect(body.token_type.toLowerCase()).toBe('bearer');
  });

  test('token grants access to the current user profile', async ({ customerApi }) => {
    const me = await customerApi.getMe();

    expect(me.email).toBe(env.customer.email);
    expect(`${me.first_name} ${me.last_name}`).toBe(env.customer.fullName);
  });

  // Uses an unknown email on purpose: wrong passwords against a real demo account
  // trigger the app's account-lockout protection and would break other tests.
  test('unknown credentials are rejected with 401', async ({ api }) => {
    const res = await api.login(uniqueEmail('nobody'), 'NotTheRightPassword1!');

    expect(res.status()).toBe(401);
    expect(await res.json()).not.toHaveProperty('access_token');
  });

  test('profile endpoint requires authentication', async ({ api }) => {
    const res = await api.me();
    expect(res.status()).toBe(401);
  });

  test('a forged token is rejected', async ({ api }) => {
    const res = await api.withToken('eyJhbGciOiJIUzI1NiJ9.e30.invalid-signature').me();
    expect(res.status()).toBe(401);
  });
});
