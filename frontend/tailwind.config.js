/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Match AssetType colors
        'asset-site': '#3B82F6',
        'asset-bts': '#8B5CF6',
        'asset-cabinet': '#F59E0B',
        'asset-fiber': '#10B981',
        'asset-manhole': '#6B7280',
        'asset-handhole': '#9CA3AF',
        'asset-splice': '#EF4444',
        'asset-pole': '#D97706',
        'asset-fdh': '#06B6D4',
      },
    },
  },
  plugins: [],
};
