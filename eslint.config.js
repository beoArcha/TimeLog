import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
    {
        ignores: [
            "dist",
            "coverage",
            "src-tauri",
            "node_modules",
            "scripts",
            ".stryker-sandbox",
            ".stryker-tmp",
            "reports"
        ],
    },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ["**/*.{ts,tsx}"],

        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },

        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },

        rules: {
            ...reactHooks.configs.recommended.rules,

            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],

            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                },
            ],

            "@typescript-eslint/no-explicit-any": "warn",
            "no-else-return": "warn",
            "no-empty": "warn",
        },
    },

    {
        files: ["src/**/*.tsx"],
        ignores: ["src/components/ui/**", "**/*.test.tsx", "**/*.spec.tsx"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea|label|table|thead|tbody|tr|th|td)$/]",
                    message: "Raw HTML element is forbidden. Use Design System primitives (@components/ui/*) or composite components (@components/*).",
                },
            ],
        },
    },

    {
        files: ["src/components/*.tsx"],
        ignores: ["src/components/ui/**", "**/*.test.tsx", "**/*.spec.tsx"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea|label|table|thead|tbody|tr|th|td)$/]",
                    message: "Raw HTML element is forbidden in composite components. Use Design System primitives (@components/ui/*).",
                },
            ],
        },
    },
];
