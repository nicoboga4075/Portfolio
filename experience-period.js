// The period of an experience of _data/resume.json for api/experiences.json, from its dates in the page language ("Juillet 2021 - Mai 2024"): its first and last month (YYYY-MM), its length in months, both counted, and whether it is still going on at the build; a date of a year alone runs from January to December ("2012 - 2015"), a single date is one month or one year, an end without a year ("Present", "Aujourd'hui") is still going on, the month names read in the page language through Intl so every language works
module.exports = function experiencePeriod(date, lang, today = new Date()) {
    const months = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, month, 1)).toLowerCase());
    const now = { year: today.getFullYear(), month: today.getMonth() + 1 };
    // The year and month of one side of the date, the month of a year alone given by its side (January at the start, December at the end), null for an end without a year
    const read = (text, side) => {
        const year = text.match(/\d{4}/);
        if (!year) return null;
        const month = months.findIndex(name => text.toLowerCase().startsWith(name)) + 1;
        return { year: Number(year[0]), month: month || (side === 'start' ? 1 : 12) };
    };
    const [startText, endText = startText] = date.split(' - ');
    const start = read(startText, 'start');
    const end = read(endText, 'end') ?? now;
    const key = ({ year, month }) => year * 12 + month;
    const format = ({ year, month }) => `${year}-${String(month).padStart(2, '0')}`;
    return { start: format(start), end: format(end), months: key(end) - key(start) + 1, ongoing: key(end) >= key(now) };
};
