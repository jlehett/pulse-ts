import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    // Global settings for all files
    {
        ignores: ['**/node_modules/**', '**/dist/**'],
    },

    // Prettier configuration (apply to all files)
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            ...prettierPlugin.configs.recommended.rules,
            'prettier/prettier': 'error',
        },
    },

    // Base configuration for JavaScript files
    {
        files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
    },

    // Configuration for TypeScript files
    {
        files: ['**/src/**/*.ts', '**/src/**/*.tsx'],
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./**/*/tsconfig.json'],
            },
        },
        rules: {
            ...tsPlugin.configs['recommended'].rules,
            // Add any custom rules for TypeScript files here
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    // Configuration for config files
    {
        files: ['**/eslint.config.js', '**/vite.config.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    // Configuration for test files
    {
        files: ['**/__tests__/**/*', '**/*.test.ts', '**/*.spec.ts'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            // Add any test-specific rules here
        },
    },

    prettierConfig,
];
