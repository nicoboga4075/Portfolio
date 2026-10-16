module.exports = {
  // The Jest tests of js/ sit next to their modules; those of the Netlify functions sit in tests/jest/netlify/, since Netlify deploys every file of netlify/functions/ as a function
  roots: ["<rootDir>/js", "<rootDir>/netlify", "<rootDir>/tests/jest"],
  // The same files as the SonarCloud coverage (sonar.coverage.exclusions in sonar-project.properties): the site's own JS and the Netlify functions, not the vendored *.min.js nor the tests
  collectCoverageFrom: [
    "service-worker.js",
    "js/**/*.js",
    "!js/**/*.min.js",
    "!js/**/*.test.js",
    "netlify/**/*.mts"
  ],
  // tests/jest/ts-transform.cjs compiles the Netlify functions (.mts) and their tests (.ts) to CommonJS, the module system Jest runs, so they can be measured and tested
  moduleFileExtensions: ["js", "mjs", "cjs", "json", "ts", "mts"],
  transform: {
    "^.+\\.m?ts$": "<rootDir>/tests/jest/ts-transform.cjs"
  },
  // The functions import each other as ./shared/http.mjs, the name of the compiled file: Jest resolves it to the .mts source
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.mjs$": "$1"
  },
  testPathIgnorePatterns: ["/node_modules/", "/docs/"],
  modulePathIgnorePatterns: ["/node_modules/", "/docs/"],
  coverageDirectory: "reports/jest/coverage",
  coverageReporters: ["lcov", "text", "html"],
  testEnvironment: "node",
  verbose: true,
  reporters: [
    "default",
    [ "jest-junit", { outputDirectory: "./reports/jest", outputName: "junit.xml" }],
	[ "jest-html-reporter", { pageTitle: "Jest Report", outputPath: "./reports/jest/html/index.html", includeFailureMsg: true, includeConsoleLog: true }]
  ]
};