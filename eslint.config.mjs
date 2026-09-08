import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

// Third-party bundles in js/, never linted (minified/vendored, not ours to fix)
const vendorJs = [
  "js/bootstrap.min.js",
  "js/chart.umd.min.js",
  "js/jquery-migrate.min.js",
  "js/jquery.easing.min.js",
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
	  "no-redeclare": "error"
	}
  },
  // js/common.js defines shared helpers that default.js and main.js consume at
  // runtime (both load after common.js). ESLint analyses each file in isolation,
  // so declare the shared names as globals for the consumers. Names both files
  // use go here; names only main.js uses are in the block below; and
  // no-unused-vars is skipped for common.js itself (its top-level declarations
  // are the whole point).
  {
    files: ["js/default.js", "js/main.js"],
    languageOptions: {
      globals: {
        appDefaultRoutes: "readonly",
        getCurrentRoute: "readonly",
        getCurrentLanguage: "readonly",
        initTranslator: "readonly",
        loadImages: "readonly",
        initCareerAnimation: "readonly",
        fillCareerCounts: "readonly",
        addRedirectById: "readonly"
      }
    }
  },
  {
    files: ["js/main.js"],
    languageOptions: {
      globals: {
        appName: "readonly",
        appRoutes: "readonly",
        getHashFromSession: "readonly",
        convertDate: "readonly",
        getCurrentFullDate: "readonly",
        xp: "readonly",
        email: "readonly",
        city: "readonly",
        dateBirth: "readonly",
        certifsCount: "readonly",
        projectsCount: "readonly",
        experiencesCount: "readonly",
        countriesCount: "readonly"
      }
    }
  },
  {
    files: ["js/common.js"],
    rules: { "no-unused-vars": "off" }
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
