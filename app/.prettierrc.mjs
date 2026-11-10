// .prettierrc.mjs
/** @type {import("prettier").Config} */
export default {
	arrowParens: 'always',
	bracketSpacing: true,
	bracketSameLine: true,
	jsxSingleQuote: true,
	singleQuote: true,
	semi: true,
	printWidth: 100,
	useTabs: true,
	tabWidth: 4,
	endOfLine: 'lf',
	trailingComma: 'all',
	// Temporarily disabled due to ESM compatibility issues in CI
	// plugins: ['prettier-plugin-tailwindcss'],
};
