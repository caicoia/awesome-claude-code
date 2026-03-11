import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system do Checkin Na Mão (fiel ao dashboard.html)
        teal: {
          DEFAULT: '#00ABA3',
          dark:    '#008F89',
          mid:     '#00C4BB',
          light:   '#E6F7F6',
        },
        amber: {
          DEFAULT: '#F5A623',
          light:   '#FEF3C7',
        },
        dark: {
          DEFAULT: '#1A2E35',
          mid:     '#2C4A52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}

export default config
