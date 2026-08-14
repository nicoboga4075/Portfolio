module.exports = {
  roots: ["<rootDir>/js", "<rootDir>/netlify"],
  collectCoverageFrom: [
    "js/default.js",
    "js/main.js"
  ],
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