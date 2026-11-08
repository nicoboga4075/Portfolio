const workYears = require('../../work-years');

describe('workYears', () => {
    test('gives the first and the last year of a job, or one year when it starts and ends the same year', () => {
        expect(workYears('July 2021 - May 2024', 'en')).toBe('2021–2024');
        expect(workYears('Juin 2024 - Septembre 2024', 'fr')).toBe('2024');
    });

    test('counts a job started in December from the next year, in every language', () => {
        expect(workYears('December 2025 - August 2026', 'en')).toBe('2026');
        expect(workYears('Décembre 2024 - Août 2025', 'fr')).toBe('2025');
        expect(workYears('December 2022 - March 2025', 'en')).toBe('2023–2025');
    });

    test('reads a single date as a job of one year', () => {
        expect(workYears('December 2025', 'en')).toBe('2025');
        expect(workYears('Mars 2023', 'fr')).toBe('2023');
    });
});
