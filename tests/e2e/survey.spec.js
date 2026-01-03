import { test, expect } from '@playwright/test';

test('completes the questionnaire and submits', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem('career_guide_language', 'en');
    });

    await page.route('**/.netlify/functions/submit', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, submission_id: 'e2e-submission', email_id: 'email-1' })
        });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Yes, I agree/i }).click();

    const readyTitle = page.getByText('Ready to Submit', { exact: true });

    for (let step = 0; step < 40; step += 1) {
        if (await readyTitle.count()) break;

        const heading = await page.locator('h2').first().textContent();

        if (heading && heading.includes('Quick check')) {
            await page.getByRole('button', { name: /Sometimes/i }).click();
        } else if (await page.locator('textarea').count()) {
            await page.locator('textarea').fill('Example');
        } else if (await page.locator('input[type="text"]').count()) {
            await page.locator('input[type="text"]').fill('Example');
        } else {
            const options = page.locator('button.option-btn');
            if (await options.count()) {
                await options.first().click();
            }
        }

        await page.locator('button.btn-primary').click();
    }

    await expect(readyTitle).toBeVisible();
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button.btn-primary').click();

    await expect(page.getByText('Submitted successfully!')).toBeVisible();
});
