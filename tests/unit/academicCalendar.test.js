import { describe, it, expect } from 'vitest';
import { getSaSchoolTermStatus } from '../../src/utils/academicCalendar';

describe('academicCalendar', () => {
    it('detects term dates for 2026', () => {
        const holiday = getSaSchoolTermStatus(new Date(2026, 0, 3));
        expect(holiday.inTerm).toBe(false);

        const termOne = getSaSchoolTermStatus(new Date(2026, 1, 10));
        expect(termOne.inTerm).toBe(true);
        expect(termOne.term).toBe(1);

        const betweenTerms = getSaSchoolTermStatus(new Date(2026, 3, 1));
        expect(betweenTerms.inTerm).toBe(false);

        const termFour = getSaSchoolTermStatus(new Date(2026, 9, 20));
        expect(termFour.inTerm).toBe(true);
        expect(termFour.term).toBe(4);
    });

    it('falls back to in-term when calendar year is missing', () => {
        const status = getSaSchoolTermStatus(new Date(2027, 0, 15));
        expect(status.inTerm).toBe(true);
        expect(status.term).toBeNull();
    });
});
