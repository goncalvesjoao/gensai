import js from '@eslint/js';
import globals from 'globals';
import astro from 'eslint-plugin-astro';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.astro/**', '.delta/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx}', '**/*.astro'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.jsx'],
    ...react.configs.flat.recommended,
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['**/*.jsx'],
    ...react.configs.flat['jsx-runtime'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.flat['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  ...astro.configs['flat/recommended'],
  {
    files: ['tests/browser/**/*.mjs'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            'Wait for bounded observable behavior; justify deliberate elapsed-time checks locally.',
        },
        {
          selector:
            "CallExpression[callee.name='setTimeout'], CallExpression[callee.property.name='setTimeout']",
          message:
            'Wait for bounded observable behavior; justify deliberate elapsed-time checks locally.',
        },
      ],
    },
  },
  prettier,
];
