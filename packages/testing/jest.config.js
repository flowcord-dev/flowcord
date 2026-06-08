/** @type {import('jest').Config} */
module.exports = {
  displayName: 'flowcord-testing',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@flowcord/core/mocks$': '<rootDir>/../core/src/mocks/index.ts',
    '^@flowcord/core$': '<rootDir>/../core/src/index.ts',
    '^@flowcord/testing$': '<rootDir>/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // barrel re-export files (no logic)
    '!src/**/__tests__/**', // test files themselves
  ],
  passWithNoTests: true,
};
