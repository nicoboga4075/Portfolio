module.exports = {
  collectCoverageFrom: [
    "js/default.js",
    "js/main.js"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/docs/"],
  modulePathIgnorePatterns: ["/docs/"],
  coverageDirectory: "reports/jest/coverage",
  testEnvironment: "node",
  verbose: true,
  reporters: [
    "default",
    [ "jest-junit", { outputDirectory: "./reports/jest", outputName: "junit.xml" }],
	[ "jest-html-reporter", { pageTitle: "Jest Report", outputPath: "./reports/jest/html/index.html", includeFailureMsg: true, includeConsoleLog: true }]
  ]
};