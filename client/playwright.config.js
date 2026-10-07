import { defineConfig, devices } from '@playwright/test';
import { API_URL } from './tests/support/env.js';

// Pick up DATABASE_URL etc. from server/.env for local runs (CI sets real env vars; existing values win)
try { process.loadEnvFile('../server/.env'); } catch { /* no .env file, rely on the environment */ }

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'on-failure' }]],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // Optional: use a pre-installed Chromium instead of Playwright's managed download
        launchOptions: process.env.PW_CHROMIUM_PATH
            ? { executablePath: process.env.PW_CHROMIUM_PATH }
            : {},
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'api',
            testMatch: 'api/**/*.spec.js',
            use: { baseURL: `${API_URL}/` },
        },
        {
            name: 'a11y',
            testMatch: 'a11y/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'chromium',
            testMatch: 'e2e/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
        },
        // Cross-browser: the same UI tests in Firefox and WebKit. Not part of `npm test`; run with
        // `npm run test:cross-browser` (CI runs them as a separate job).
        {
            name: 'firefox',
            testMatch: 'e2e/**/*.spec.js',
            use: { ...devices['Desktop Firefox'] },
        },
        // Phone-sized screen (Chromium device emulation): the same UI tests at 393 x 851 with touch.
        {
            name: 'mobile-chrome',
            testMatch: 'e2e/**/*.spec.js',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'webkit',
            testMatch: 'e2e/**/*.spec.js',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    /* Start the API and the React client; both are reused if already running locally */
    webServer: [
        {
            command: 'npm start',
            cwd: '../server',
            url: 'http://localhost:5000/',
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
        },
    ],
});
