/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testTimeout: 15000,
    testEnvironment: "node",
    modulePathIgnorePatterns: ["dist/*"],
    setupFiles: ["dotenv/config"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json"
            }
        ]
    }
}
