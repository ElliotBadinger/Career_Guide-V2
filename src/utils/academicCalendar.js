import saCalendar from '../../config/academic_calendar.sa.json';

function parseLocalDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getLocalDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getSaSchoolTermStatus(date = new Date()) {
    const localDate = getLocalDateOnly(date);
    const year = String(localDate.getFullYear());
    const terms = saCalendar.terms[year];

    if (!terms) {
        return {
            inTerm: true,
            term: null,
            year
        };
    }

    for (const term of terms) {
        const start = parseLocalDate(term.start);
        const end = parseLocalDate(term.end);

        if (localDate >= start && localDate <= end) {
            return {
                inTerm: true,
                term: term.term,
                year
            };
        }
    }

    return {
        inTerm: false,
        term: null,
        year
    };
}
