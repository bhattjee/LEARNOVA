import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
declare const _default: {
    darkMode: ["class"];
    content: string[];
    theme: {
        extend: {
            fontFamily: {
                sans: [string, string, string];
            };
            colors: {
                primary: {
                    DEFAULT: string;
                    hover: string;
                    light: string;
                };
                brand: {
                    black: string;
                    "dark-grey": string;
                    "mid-grey": string;
                    "light-grey": string;
                };
                status: {
                    danger: string;
                    warning: string;
                    purple: string;
                    success: string;
                };
            };
            borderRadius: {
                sm: string;
                md: string;
                lg: string;
                xl: string;
            };
        };
    };
    plugins: ({
        handler: () => void;
    } | typeof forms | typeof typography)[];
};
export default _default;
