import 'dotenv/config';

export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
  apiUrl: process.env.API_URL ?? 'https://api.practicesoftwaretesting.com',
  customer: {
    email: process.env.CUSTOMER_EMAIL ?? 'customer@practicesoftwaretesting.com',
    password: process.env.CUSTOMER_PASSWORD ?? 'welcome01',
    fullName: 'Jane Doe',
  },
} as const;

export const AUTH_STATE_FILE = 'playwright/.auth/customer.json';
