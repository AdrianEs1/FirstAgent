export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        'border-spin': {
          '0%':   { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
      },
      animation: {
        'border-spin': 'border-spin 3s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}