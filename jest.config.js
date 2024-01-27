/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    collectCoverage: true,
    coverageReporters: ["html"],
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
