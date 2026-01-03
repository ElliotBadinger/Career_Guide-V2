import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../src/hooks/useI18n';
import { QuestionRenderer } from '../../src/components/QuestionRenderer';

const renderWithI18n = (ui) => {
    return render(<I18nProvider>{ui}</I18nProvider>);
};

describe('QuestionRenderer', () => {
    beforeEach(() => {
        localStorage.setItem('career_guide_language', 'en');
    });

    it('renders optional label and handles single choice', async () => {
        const onChange = vi.fn();
        renderWithI18n(
            <QuestionRenderer
                question={{
                    id: 'age',
                    type: 'single',
                    required: false,
                    label: 'i18n:questions.age.label',
                    options: [
                        { value: 'under18', label: 'i18n:questions.age.options.under18' },
                        { value: '18', label: 'i18n:questions.age.options.18' }
                    ]
                }}
                value=""
                onChange={onChange}
            />
        );

        expect(screen.getByText('(optional)')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Under 18/i }));
        expect(onChange).toHaveBeenCalledWith('under18');
    });

    it('handles multi choice selections', async () => {
        const onChange = vi.fn();
        renderWithI18n(
            <QuestionRenderer
                question={{
                    id: 'strengths',
                    type: 'multi',
                    required: true,
                    label: 'i18n:questions.strengths.label',
                    options: [
                        { value: 'hands', label: 'i18n:questions.strengths.options.hands' },
                        { value: 'people', label: 'i18n:questions.strengths.options.people' }
                    ]
                }}
                value={[]}
                onChange={onChange}
            />
        );

        await userEvent.click(screen.getByRole('button', { name: /Working with my hands/i }));
        expect(onChange).toHaveBeenCalledWith(['hands']);
    });

    it('handles text and textarea input', async () => {
        const onTextChange = vi.fn();
        renderWithI18n(
            <QuestionRenderer
                question={{
                    id: 'name',
                    type: 'text',
                    required: false,
                    label: 'i18n:questions.name.label'
                }}
                value=""
                onChange={onTextChange}
            />
        );

        await userEvent.type(screen.getByRole('textbox'), 'Ava');
        expect(onTextChange).toHaveBeenCalled();
    });

    it('handles textarea input', async () => {
        const onAreaChange = vi.fn();
        renderWithI18n(
            <QuestionRenderer
                question={{
                    id: 'learningExample',
                    type: 'textarea',
                    required: false,
                    label: 'i18n:questions.learningExample.label'
                }}
                value=""
                onChange={onAreaChange}
            />
        );

        await userEvent.type(screen.getByRole('textbox'), 'Example');
        expect(onAreaChange).toHaveBeenCalled();
    });
});
