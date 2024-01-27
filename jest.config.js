/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    coverageReporters: ["lcov"],
    preset: "ts-jest",
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
