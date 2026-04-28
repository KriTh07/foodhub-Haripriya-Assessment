/** @type {import('jest').Config} */
const sharedTransform = {
  '^.+\\.(ts|tsx|js)$': ['ts-jest', {
    tsconfig: { jsx: 'react', module: 'commonjs', moduleResolution: 'node' }
  }]
}

const sharedModuleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' }

const allureReporter = ['jest-allure2-reporter', {
  resultsDir: 'allure-results/jest',
  attachments: { subDir: 'attachments' }
}]

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/api/**/*.test.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform
    },
    {
      displayName: 'contract',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform
    }
  ],
  reporters: ['default', allureReporter]
}
