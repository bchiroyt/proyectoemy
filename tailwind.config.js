/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // AQUÍ deben ir los colores de shadcn
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        'pagina': 'var(--color-pagina)',
        'blanco-pos': 'var(--color-blanco)',
        // ... otros colores
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}