/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
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
