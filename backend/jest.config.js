process.env.DATABASE_URL = "postgresql://mockuser:mockpass@localhost:5432/mockdb?schema=public";
process.env.JWT_SECRET = "mockaccesssecretfortests123456789012";
process.env.JWT_REFRESH_SECRET = "mockrefreshsecretfortests123456789012";
process.env.GEMINI_API_KEY = "mockgeminiapikey";
process.env.NODE_ENV = "test";

module.exports = {
  transform: {
    '^.+\\.ts$': 'esbuild-jest',
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true, // Only clear call histories, preserve mock implementations
};
