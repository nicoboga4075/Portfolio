// The years of a job for the back of the work experiences counter, from its dates in the page language ("Juin 2024 - Septembre 2024"): one year when it starts and ends the same year, else the first and the last joined by an en dash; a job started in December counts from the next year, its one month there being no year of work ("December 2025 - August 2026" gives 2026), December read in the page language through Intl so every language works
module.exports = function workYears(date, lang) {
    const [start, end = start] = date.split(' - ');
    const year = text => Number(text.match(/\d{4}/)[0]);
    const december = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, 11, 1)).toLowerCase();
    const first = year(start) + (start.toLowerCase().startsWith(december) ? 1 : 0);
    const last = year(end);
    return first >= last ? `${last}` : `${first}–${last}`;
};
