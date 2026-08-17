import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

// Third-party bundles in js/, never linted (minified/vendored, not ours to fix)
const vendorJs = [
  "js/aos.js",
  "js/bootstrap.min.js",
  "js/chart.js",
  "js/jquery-migrate-3.0.1.min.js",
  "js/jquery.animateNumber.min.js",
  "js/jquery.easing.1.3.js",
  "js/jquery.magnific-popup.min.js",
  "js/jquery.min.js",
  "js/jquery.stellar.min.js",
  "js/jquery.waypoints.min.js",
  "js/owl.carousel.min.js",
  "js/popper.min.js",
  "js/scrollax.min.js"
];

export default defineConfig([
  // Generated build/test output, regenerated on every run
  { ignores: ["reports/", ".eleventy/", ".netlify/"] },
  // JS config
  {
    files: ["**/*.js"],
    ignores: vendorJs,
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
	  sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
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
	  // Called from inline HTML or external callbacks (ESLint can't see the usage),
	  // or intentionally kept for future use (getCurrentOnlyDate)
	  "no-unused-vars": ["warn", { varsIgnorePattern: "^(initPage|initCaptcha|initArticle|gapiLoaded|gisLoaded|toggleDarkMode|getCurrentOnlyDate)$" }],
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
