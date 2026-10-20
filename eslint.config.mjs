import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

// Third-party bundles in js/, never linted (minified/vendored, not ours to fix)
const vendorJs = [
  "js/bootstrap.min.js",
  "js/chart.umd.min.js",
  "js/chartjs-plugin-doughnutlabel.min.js",
  "js/i18next.min.js",
  "js/jquery-migrate.min.js",
  "js/jquery.easing.min.js",
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
      // No ecmaVersion: ESLint parses the latest syntax, so the JS needs ES2022 at least and may use newer syntax; ecmaVersion: 2022 would cap the syntax (the regex v flag of ES2024 becomes a parsing error) but never the APIs (toSorted, Object.groupBy still pass)
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
		Chart: "readonly"
      },
    },
	rules : {
	  // Called from inline HTML or external callbacks (ESLint can't see the usage),
	  // or kept for future use (parseDate).
	  "no-unused-vars": ["warn", { varsIgnorePattern: "^(initPage|initCaptcha|initArticle|gapiLoaded|gisLoaded|parseDate)$" }],
	  "no-undef": "error",
	  "no-var": "warn",
	  // warn/error are trusted as real diagnostics; only console.log is flagged
	  "no-console": ["warn", { allow: ["warn", "error"] }],
	  "no-debugger": "warn",
	  "prefer-const": "warn",
	  "semi": "error",
	  "no-redeclare": "error",
	  // Security: no code built from strings, no blocking dialog (it also freezes the browser tests)
	  "no-eval": "error",
	  "no-implied-eval": "error",
	  "no-new-func": "error",
	  "no-alert": "error",
	  // Common bugs
	  "eqeqeq": ["error", "always", { "null": "ignore" }],
	  "curly": ["error", "multi-line"],
	  "no-throw-literal": "error",
	  "prefer-promise-reject-errors": "error",
	  "array-callback-return": "error",
	  "no-self-compare": "error",
	  "no-template-curly-in-string": "error",
	  "no-unmodified-loop-condition": "error",
	  "default-param-last": "error",
	  // Readability, with ES2022 at least
	  "prefer-object-has-own": "error",
	  "no-unneeded-ternary": "error",
	  "no-useless-return": "error",
	  "no-nested-ternary": "error",
	  "no-lonely-if": "error",
	  "dot-notation": "error",
	  "object-shorthand": "error",
	  "no-return-assign": "error",
	  // ES2024 APIs that Node 20 of the CI lacks: ecmaVersion only checks the syntax, not the APIs
	  "no-restricted-properties": ["error",
	    { "object": "Object", "property": "groupBy", "message": "ES2024, missing on Node 20: group with reduce." },
	    { "object": "Map", "property": "groupBy", "message": "ES2024, missing on Node 20: group with reduce." },
	    { "object": "Promise", "property": "withResolvers", "message": "ES2024, missing on Node 20: use new Promise." }
	  ]
	}
  },
  // js/common.js defines shared helpers that standalone.js and app.js consume at
  // runtime (both load after common.js). ESLint analyses each file in isolation,
  // so declare the shared names as globals for the consumers. Names both files
  // use go here; names only app.js uses are in the block below; and
  // no-unused-vars is skipped for common.js itself (its top-level declarations
  // are the whole point).
  {
    files: ["js/standalone.js", "js/app.js"],
    languageOptions: {
      globals: {
        getCurrentRoute: "readonly",
        getCurrentLanguage: "readonly",
        initTranslator: "readonly",
        loadImages: "readonly",
        addRedirectById: "readonly"
      }
    }
  },
  {
    files: ["js/app.js"],
    languageOptions: {
      globals: {
        initArticle: "readonly",
        appRoutes: "readonly",
        getHashFromSession: "readonly",
        i18next: "readonly",
        Calendly: "readonly",
        convertDate: "readonly",
        getCurrentFullDate: "readonly"
      }
    }
  },
  {
    files: ["js/common.js"],
    rules: { "no-unused-vars": "off" }
  },
  // Jest unit tests (js/*.test.js, netlify/**/*.test.js): describe, test, expect, jest...
  {
    files: ["**/*.test.js"],
    languageOptions: { globals: { ...globals.jest } }
  },
  // MTS config
  {
    files: ["netlify/functions/**/*.mts"],
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
