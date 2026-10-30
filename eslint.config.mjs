import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'toolshop'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // `async ({}, use) => …` is the idiomatic Playwright fixture signature.
    files: ['src/fixtures/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      // Assertions frequently live inside page objects / API helpers.
      'playwright/expect-expect': 'off',
    },
  },
);
