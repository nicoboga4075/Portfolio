import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Generated Jest coverage reports, regenerated on every test run
  { ignores: ["reports/"] },
  // JS config
  {
    files: ["js/main.js", "js/default.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
	  sourceType: "script",
      globals: {
        ...globals.browser,
        $: "readonly",
        jQuery: "readonly",
		grecaptcha: "readonly",
		bootstrap: "readonly",
		google: "readonly",
		gapi: "readonly",
		Chart: "readonly",
		AOS: "readonly"
      },
    },
	rules : {
	  // Called from inline HTML or external callbacks, so ESLint can't see the usage
	  "no-unused-vars": ["warn", { varsIgnorePattern: "^(initPage|initCaptcha|initArticle|gapiLoaded|gisLoaded|toggleDarkMode)$" }],
	  "no-undef": "error",
	  "no-var": "warn",
	  // warn/error are trusted as real diagnostics; only console.log is flagged
	  "no-console": ["warn", { allow: ["warn", "error"] }],
	  "no-debugger": "warn",
	  "prefer-const": "warn",
	  "semi": "error",
	  "no-redeclare": "error"
	}
  },
  // MTS config
  {
    files: ["netlify/functions/*.mts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
	    project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest"
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-floating-promises": "error",
	  "@typescript-eslint/require-await": "warn"
    }
  }
]);