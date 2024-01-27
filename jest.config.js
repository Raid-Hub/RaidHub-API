/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    coverageReporters: ["lcov"],
    preset: "ts-jest",
    testTimeout: 15000,
    testEnvironment: "node",
    modulePathIgnorePatterns: ["dist/*"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json"
            }
        ]
    }
}
