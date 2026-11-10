// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				body: ['var(--font-body)', 'sans-serif'],
				heading: ['var(--font-heading)', 'sans-serif'],
				'montserrat-medium': ['Montserrat_500Medium', 'sans-serif'],
				'montserrat-bold': ['Montserrat_700Bold', 'sans-serif'],
			},
		},
	},
	plugins: [
		function ({ addUtilities }) {
			const newUtilities = {
				'.font-heading': {
					fontFamily: 'BebasNeue-Regular',
					textTransform: 'uppercase',
					fontStyle: 'italic',
					fontWeight: '900',
					letterSpacing: '-0.02em',
				},
				'.font-body': {
					fontFamily: 'Montserrat-ExtraBold',
				},
			};
			addUtilities(newUtilities);
		},
	],
	presets: [require('nativewind/preset')],
};
