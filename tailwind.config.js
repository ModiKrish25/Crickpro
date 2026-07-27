const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Scan all component and app files for Tailwind classes
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}", "./hooks/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...tailwindColors,
        glass: {
          DEFAULT: 'var(--color-glass)',
          light: 'rgba(255,255,255,0.72)',
          dark: 'rgba(255,255,255,0.08)',
        },
        'glass-border': {
          DEFAULT: 'var(--color-glass-border)',
          light: 'rgba(255,255,255,0.5)',
          dark: 'rgba(255,255,255,0.12)',
        },
        'glass-highlight': {
          DEFAULT: 'rgba(255,255,255,0.8)',
          light: 'rgba(255,255,255,0.8)',
          dark: 'rgba(255,255,255,0.15)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Helvetica Neue', 'sans-serif'],
        rounded: ['SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '20px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-xl': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(0, 102, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 102, 255, 0.2)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};
