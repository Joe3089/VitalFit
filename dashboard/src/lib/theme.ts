export const THEME_STORAGE_KEY = "vitalfit-theme";

/**
 * Inline script for the root layout: applies the saved (or system) theme
 * before the first paint to avoid a light flash in dark mode.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;
