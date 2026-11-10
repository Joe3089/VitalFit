// ESLint configuration for VitalFit SDK
// Based on migration guide for ESLint v9.0.0+

// Import necessary plugins and parser
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import parser from '@typescript-eslint/parser'; // Import the parser directly

export default [
  {
    ignores: ['dist/**'], // Ignore the dist directory
  },
  // Base configuration for all files
  {
    // Define the parser and language options
    languageOptions: {
      parser: parser, // Use the imported parser object
      ecmaVersion: 'latest', // Support the latest ECMAScript features
      sourceType: 'module', // Allow import/export syntax
      globals: {
        // Define global variables available in the environment
        // For Node.js and Jest environments, these are often implicitly available
        // or handled by ts-jest, but explicit declaration can help ESLint.
        // We'll rely on ts-jest and the testEnvironment in jest.config.cjs for now.
      },
    },
    // Define plugins to use
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
    },
    // Define rules
    rules: {
      // Use prettier/prettier rule to enforce Prettier formatting
      'prettier/prettier': 'error',
      // Add other ESLint rules here as needed
      // Example: '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  // Specific configuration for TypeScript files
  {
    files: ['*.ts', '*.tsx'], // Apply these rules to TypeScript files
    rules: {
      // TypeScript specific rules can be added here
      // For example, to ensure no unused variables:
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
