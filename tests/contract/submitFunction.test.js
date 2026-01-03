/* @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handler } from '../../netlify/functions/submit.js';

const baseEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        submission_id: 'submission-123',
        created_at: new Date().toISOString(),
        answers: {}
    })
};

const ORIGINAL_ENV = { ...process.env };

describe('submit netlify function', () => {
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        process.env = { ...ORIGINAL_ENV };
    });

    it('rejects non-POST requests', async () => {
        const response = await handler({ httpMethod: 'GET' }, {});
        expect(response.statusCode).toBe(405);
    });

    it('rejects invalid JSON', async () => {
        const response = await handler({ httpMethod: 'POST', body: '{bad' }, {});
        expect(response.statusCode).toBe(400);
    });

    it('rejects missing required fields', async () => {
        const response = await handler(
            {
                httpMethod: 'POST',
                body: JSON.stringify({ created_at: new Date().toISOString() })
            },
            {}
        );
        expect(response.statusCode).toBe(400);
    });

    it('rejects when email config missing', async () => {
        delete process.env.RESEND_API_KEY;
        const response = await handler(baseEvent, {});
        expect(response.statusCode).toBe(500);
    });

    it('returns success on valid submission', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        process.env.RECIPIENT_EMAIL = 'test@example.com';
        process.env.FROM_EMAIL = 'from@example.com';

        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            json: async () => ({ id: 'email-123' })
        })));

        const response = await handler(baseEvent, {});
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.email_id).toBe('email-123');
    });

    it('handles resend failures', async () => {
        process.env.RESEND_API_KEY = 'test-key';

        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: false,
            json: async () => ({ message: 'bad' })
        })));

        const response = await handler(baseEvent, {});
        expect(response.statusCode).toBe(500);
    });
});
