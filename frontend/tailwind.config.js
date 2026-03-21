import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";
export default {
    // Light-mode-only UI per .cursorrules; `dark:` variants are not used.
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "#1D4ED8",
                    hover: "#1E40AF",
                    light: "#EFF6FF",
                },
                brand: {
                    black: "#0F172A",
                    "dark-grey": "#464749",
                    "mid-grey": "#C5CAD3",
                    "light-grey": "#F3F4F6",
                },
                status: {
                    danger: "#EF4444",
                    warning: "#F5AA29",
                    purple: "#7632EC",
                    success: "#058E61",
                },
            },
            borderRadius: {
                sm: "6px",
                md: "8px",
                lg: "12px",
                xl: "16px",
            },
        },
    },
    plugins: [animate, forms, typography],
};
