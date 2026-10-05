import { defineConfig, devices } from '@playwright/test';

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
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] },
        // },
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
