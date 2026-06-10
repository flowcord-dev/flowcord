/** @type {import('jest').Config} */
module.exports = {
  displayName: 'flowcord',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    // The mocks subpath resolves to source so unit tests run without a build.
    '^@flowcord/core/mocks$': '<rootDir>/src/mocks/index.ts',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // barrel re-export files (no logic)
    '!src/mocks/**', // test mocks — shipped via @flowcord/core/mocks, not product logic
    '!src/**/__tests__/**', // test files themselves
  ],
  passWithNoTests: true,
};
