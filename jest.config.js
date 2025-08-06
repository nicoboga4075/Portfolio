module.exports = {
  collectCoverageFrom: [
    "js/default.js",
    "js/main.js",
	"netlify/functions/*.js"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/docs/"],
  modulePathIgnorePatterns: ["/docs/"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  verbose: true,
  reporters: [
    "default",
    [ "jest-junit", { outputDirectory: "./reports", outputName: "junit.xml" } ]
  ]
};