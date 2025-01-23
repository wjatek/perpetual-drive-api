module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  globalSetup: './src/tests/jest.setup.ts',
  setupFilesAfterEnv: ['./src/tests/matchers.ts'],
}
