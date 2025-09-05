import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm', // 👈 para ESM
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }], // 👈 ESM transform
  },
  extensionsToTreatAsEsm: ['.ts'], // 👈 trata .ts como ESM
  moduleNameMapper: {
    '^(.*)\\.js$': '$1', // 👈 permite que import './x.js' funcione
  },
};

export default config;
