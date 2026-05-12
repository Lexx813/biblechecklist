import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.next', '.vercel', '.agents', '.claude', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['next.config.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        clients: 'readonly',
      },
    },
  },
])
