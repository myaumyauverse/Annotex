module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  coverageProvider: 'v8',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        // Type-check test files. Previously false, which combined with the
        // tsconfig exclude and the ESLint ignorePatterns meant test code had no
        // static analysis at all — a typo in an assertion only surfaced as a
        // confusing runtime failure.
        diagnostics: true,
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/server.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // A floor, not a target. Set just under the measured baseline on main
  // (50.95 stmts / 66.4 branch / 39.21 funcs) so ordinary variation does not
  // fail a build, while a real drop does. Without this, coverage could fall to
  // zero and CI would still pass.
  //
  // Raise these as suites land. They are meant to ratchet upward and never down.
  coverageThreshold: {
    global: {
      statements: 48,
      branches: 62,
      functions: 36,
      lines: 48,
    },
  },
  moduleNameMapper: {
    '^@solana/web3\\.js$': '<rootDir>/src/__tests__/mocks/solanaWeb3.ts',
    '^@solana/pay$': '<rootDir>/src/__tests__/mocks/solanaPay.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
};
