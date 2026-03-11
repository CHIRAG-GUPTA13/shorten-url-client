/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0f',
        'dark-lighter': '#12121a',
        'dark-border': '#1a1a24',
        accent: {
          green: '#bfff00',
          blue: '#00e5ff',
          red: '#ff2d55'
        },
        muted: '#6b7280'
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'noise': "url('https://grainy-gradients.vercel.app/noise.svg')",
      }
    },
  },
  plugins: [],
}
