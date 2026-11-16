const experiencePeriod = require('../../experience-period');

const today = new Date(2026, 10, 16);

describe('experiencePeriod', () => {
    test('gives the first and the last month of an experience and its length in months, both counted, in every language', () => {
        expect(experiencePeriod('July 2021 - May 2024', 'en', today)).toEqual({ start: '2021-07', end: '2024-05', months: 35, ongoing: false });
        expect(experiencePeriod('Décembre 2024 - Août 2025', 'fr', today)).toEqual({ start: '2024-12', end: '2025-08', months: 9, ongoing: false });
    });

    test('runs a year alone from January to December', () => {
        expect(experiencePeriod('2012 - 2015', 'en', today)).toEqual({ start: '2012-01', end: '2015-12', months: 48, ongoing: false });
    });

    test('reads a single date as one month', () => {
        expect(experiencePeriod('Mars 2023', 'fr', today)).toEqual({ start: '2023-03', end: '2023-03', months: 1, ongoing: false });
    });

    test('keeps an experience going on when it ends this month or later, or without a year', () => {
        expect(experiencePeriod('June 2026 - November 2026', 'en', today).ongoing).toBe(true);
        expect(experiencePeriod('Septembre 2026 - Aujourd\'hui', 'fr', today)).toEqual({ start: '2026-09', end: '2026-11', months: 3, ongoing: true });
    });

    test('reads the build date when none is given', () => {
        expect(experiencePeriod('2012 - 2015', 'en').ongoing).toBe(false);
    });
});
