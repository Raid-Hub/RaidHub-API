/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testTimeout: 15000,
    modulePathIgnorePatterns: ["dist/*"],
    coveragePathIgnorePatterns: ["prisma.ts"],
    setupFiles: ["dotenv/config"],
    coverageReporters: ["html"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json"
            }
        ]
    }
}
