const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: '.', outputName: 'test-results.xml' }],
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: Number(process.env.COVERAGE_THRESHOLD_BRANCHES) || 80,
      functions: Number(process.env.COVERAGE_THRESHOLD_FUNCTIONS) || 80,
      lines: Number(process.env.COVERAGE_THRESHOLD_LINES) || 80,
      statements: Number(process.env.COVERAGE_THRESHOLD_STATEMENTS) || 80,
    },
  },
};