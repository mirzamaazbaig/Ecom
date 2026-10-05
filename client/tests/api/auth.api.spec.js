/**
 * Auth API tests: POST /auth/register, /auth/login, /auth/logout, GET /auth/me
 * Test Suite ID: TS_API_AUTH
 *
 * Cases tagged "KNOWN DEFECT" assert the CORRECT behaviour and are marked test.fail():
 * they pass while the defect exists and turn red as soon as it is fixed
 * (then remove test.fail). See docs/KNOWN_DEFECTS.md.
 */
import { test, expect, sql, uniqueEmail, PASSWORD } from './support.js';

test.describe('TS_API_AUTH: Authentication API', () => {

    test('TC_API_AUTH_001: register returns 201 and the new user without a password hash', async ({ anon }) => {
        const email = uniqueEmail();
        const res = await anon.post('auth/register', { data: { email, password: PASSWORD } });

        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.user).toMatchObject({ email, role: 'user' });
        expect(body.user.id).toEqual(expect.any(Number));
        expect(JSON.stringify(body)).not.toContain('password');
    });

    test('TC_API_AUTH_002: registration starts a session', async ({ anon }) => {
        const email = uniqueEmail();
        await anon.post('auth/register', { data: { email, password: PASSWORD } });

        const me = await anon.get('auth/me');
        expect(me.status()).toBe(200);
        expect((await me.json()).user.email).toBe(email);
    });

    test('TC_API_AUTH_003: duplicate email is rejected with 400', async ({ anon, user }) => {
        const res = await anon.post('auth/register', { data: { email: user.email, password: PASSWORD } });
        expect(res.status()).toBe(400);
        expect((await res.json()).message).toBe('User already exists');
    });

    test('TC_API_AUTH_004: password is stored as a bcrypt hash, never in clear text', async ({ user }) => {
        const [row] = await sql('SELECT password_hash FROM users WHERE id = $1', [user.id]);
        expect(row.password_hash).not.toBe(user.password);
        expect(row.password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    test('TC_API_AUTH_005: login with valid credentials returns the user and starts a session', async ({ anon, user }) => {
        const res = await anon.post('auth/login', { data: { email: user.email, password: user.password } });
        expect(res.status()).toBe(200);
        expect((await res.json()).user).toMatchObject({ id: user.id, email: user.email, role: 'user' });
        expect((await anon.get('auth/me')).status()).toBe(200);
    });

    test('TC_API_AUTH_006: wrong password and unknown email return the same error (no user enumeration)', async ({ anon, user }) => {
        const wrongPassword = await anon.post('auth/login', { data: { email: user.email, password: 'WrongPass1!' } });
        const unknownEmail = await anon.post('auth/login', { data: { email: uniqueEmail('ghost'), password: PASSWORD } });

        expect(wrongPassword.status()).toBe(400);
        expect(unknownEmail.status()).toBe(400);
        expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
        expect((await anon.get('auth/me')).status()).toBe(401);
    });

    test('TC_API_AUTH_007: /auth/me without a session returns 401', async ({ anon }) => {
        const res = await anon.get('auth/me');
        expect(res.status()).toBe(401);
    });

    test('TC_API_AUTH_008: logout ends the session', async ({ user }) => {
        expect((await user.api.get('auth/me')).status()).toBe(200);

        const res = await user.api.post('auth/logout');
        expect(res.status()).toBe(200);

        expect((await user.api.get('auth/me')).status()).toBe(401);
    });

    test('TC_API_AUTH_009 [KNOWN DEFECT D3]: malformed email should be rejected with 400', async ({ anon }) => {
        test.fail(true, 'D3: any string is accepted as an email address');
        // Unique per run: a fixed string would be "already registered" on the second run and pass for the wrong reason
        const malformed = `not-an-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        try {
            const res = await anon.post('auth/register', { data: { email: malformed, password: PASSWORD } });
            expect(res.status()).toBe(400);
        } finally {
            await sql('DELETE FROM users WHERE email = $1', [malformed]);
        }
    });

    test('TC_API_AUTH_010 [KNOWN DEFECT D4]: missing fields should return 400, not a server error', async ({ anon }) => {
        test.fail(true, 'D4: empty body causes an unhandled error and a 500 response');
        const res = await anon.post('auth/register', { data: {} });
        expect(res.status()).toBe(400);
    });
});
