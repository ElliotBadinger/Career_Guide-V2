import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../src/hooks/useI18n';
import { ConsentScreen } from '../../src/components/ConsentScreen';

const renderWithI18n = (ui) => render(<I18nProvider>{ui}</I18nProvider>);

describe('ConsentScreen', () => {
    beforeEach(() => {
        localStorage.setItem('career_guide_language', 'en');
    });

    it('calls handlers for agree and disagree', async () => {
        const onAgree = vi.fn();
        const onDisagree = vi.fn();

        renderWithI18n(<ConsentScreen onAgree={onAgree} onDisagree={onDisagree} />);

        await userEvent.click(screen.getByRole('button', { name: /Yes, I agree/i }));
        await userEvent.click(screen.getByRole('button', { name: /No, I do not want to/i }));

        expect(onAgree).toHaveBeenCalledTimes(1);
        expect(onDisagree).toHaveBeenCalledTimes(1);
    });
});
