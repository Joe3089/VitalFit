import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
	js.configs.recommended,

	...tseslint.configs.recommended,

	react.configs.flat.recommended,

	{ settings: { react: { version: 'detect' } } },

	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		plugins: {
			'react-hooks': reactHooks,
		},
		rules: {
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},

	{
		files: ['*.js', 'metro.config.js', 'remove_console.js', 'scripts/**/*.js'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: { ...globals.node },
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-var-requires': 'off',
			'no-console': 'off',
		},
	},

	{
		ignores: ['node_modules', 'dist', 'build', 'android', 'ios', '.expo', '.prettierrc.js'],
	},

	prettier,
]);
