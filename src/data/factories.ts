import { randomUUID } from 'node:crypto';
import type { RegisterPayload } from '../api/ToolshopApi';

/** Unique, disposable identity so tests never collide on the shared public demo. */
export function uniqueEmail(prefix = 'pw'): string {
  return `${prefix}.${Date.now()}.${randomUUID().slice(0, 8)}@example.com`;
}

/** Random password that satisfies the app's policy (length, mixed case, digit, symbol). */
export function strongPassword(): string {
  return `Pw!${randomUUID().replace(/-/g, '').slice(0, 12)}Zz9`;
}

export function newCustomer(overrides: Partial<RegisterPayload> = {}): RegisterPayload {
  return {
    first_name: 'Playwright',
    last_name: 'Tester',
    dob: '1990-05-17',
    phone: '0612345678',
    email: uniqueEmail(),
    password: strongPassword(),
    address: {
      street: 'Teststraat 1',
      city: 'Utrecht',
      state: 'Utrecht',
      country: 'NL',
      postal_code: '3511AA',
    },
    ...overrides,
  };
}
