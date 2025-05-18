/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#5bc0de',
                    dark: '#2a6881',
                    light: '#a8e0f0'
                }
            }
        },
    },
    plugins: []
}
