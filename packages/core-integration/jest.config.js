/** @type {import('jest').Config} */
module.exports = {
  // rootDir spans the workspace so jest can instrument @flowcord/core's sources
  // (which these tests exercise through the harness) — jest only collects
  // coverage for files under rootDir.
  rootDir: '../..',
  displayName: 'flowcord-core-integration',
  testEnvironment: 'node',
  transform: {
    // tsconfig.spec.json sets isolatedModules:true, so ts-jest transpiles only
    // (these tests load core's source from outside this project's rootDir, which
    // a full type-check would reject). Type safety is the `typecheck` target's job.
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/packages/core-integration/tsconfig.spec.json' },
    ],
  },
  testMatch: ['<rootDir>/packages/core-integration/src/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@flowcord/core/mocks$': '<rootDir>/packages/core/src/mocks/index.ts',
    '^@flowcord/core$': '<rootDir>/packages/core/src/index.ts',
    '^@flowcord/testing$': '<rootDir>/packages/testing/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/packages/core-integration/jest.setup.ts'],
  coverageDirectory: '<rootDir>/packages/core-integration/coverage',
  // Attribute coverage to core's sources. lcov SF paths are emitted as
  // `../core/src/...`, which resolve correctly against core's Sonar
  // projectBaseDir (packages/core) — they are merged into core's analysis via
  // sonar.javascript.lcov.reportPaths, no path rewriting required.
  collectCoverageFrom: [
    'packages/core/src/**/*.ts',
    '!packages/core/src/**/*.d.ts',
    '!packages/core/src/**/index.ts',
    '!packages/core/src/mocks/**',
    '!packages/core/src/**/__tests__/**',
  ],
  passWithNoTests: true,
};
