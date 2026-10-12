module.exports = {
  roots: ["<rootDir>/js", "<rootDir>/netlify"],
  // The same files as the SonarCloud coverage (sonar.coverage.exclusions in sonar-project.properties): the site's own JS and the Netlify functions, not the vendored *.min.js nor the tests
  collectCoverageFrom: [
    "service-worker.js",
    "js/**/*.js",
    "!js/**/*.min.js",
    "!js/**/*.test.js",
    "netlify/**/*.mts"
  ],
  // ts-jest compiles the Netlify functions (.mts) so they can be measured and tested
  moduleFileExtensions: ["js", "mjs", "cjs", "json", "ts", "mts"],
  transform: {
    "^.+\\.mts$": ["ts-jest", { diagnostics: false }]
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