// The data of the book of the About section and of the globe of the counter section: the book turns two pages per leaf, so each language has an even number of pages, the same in English and French, each a list of lines or one diploma; each visited country has the id of its shape in the vendored world map and the coordinates of its dot.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test.describe('book of my path', () => {
    const book = read('_data/book.json');

    test('has an even number of pages, the same in every language, each with a title and its lines', () => {
        expect(book.en.sheets.length % 2).toBe(0);
        expect(book.fr.sheets).toHaveLength(book.en.sheets.length);
        for (const lang of ['en', 'fr']) {
            book.fr.sheets.forEach((sheet, index) => expect(sheet.items, `${lang} page ${index + 1}`).toHaveLength(book.en.sheets[index].items.length));
            for (const sheet of book[lang].sheets) {
                expect(sheet.title).toBeTruthy();
                for (const item of sheet.items) expect(item.text).toBeTruthy();
                // A page holds a list of lines or one diploma, never neither
                expect(sheet.items.length > 0 || Boolean(sheet.diploma), sheet.title).toBe(true);
            }
            book[lang].sheets.forEach((sheet, index) => expect(sheet.diploma?.schools, `${lang} page ${index + 1}`).toEqual(book.en.sheets[index].diploma?.schools));
            expect(book[lang].pages).toContain('{from}');
            expect(book[lang].pages).toContain('{to}');
            expect(book[lang].pages).toContain('{total}');
        }
    });
});

test.describe('globe of the visited countries', () => {
    const { countryList } = read('_data/counter.json');
    const ids = new Set(read('js/countries-110m.json').objects.countries.geometries.map(country => country.id));

    test('places each visited country on the world map, Vatican City by its dot only, too small for the 1:110m map', () => {
        for (const country of countryList) {
            expect(country.iso, country.flag).toMatch(/^\d{3}$/);
            const [longitude, latitude] = country.coords;
            expect(Math.abs(longitude), country.flag).toBeLessThanOrEqual(180);
            expect(Math.abs(latitude), country.flag).toBeLessThanOrEqual(90);
            expect(ids.has(country.iso), country.flag).toBe(country.flag !== 'va');
        }
    });

    test('loads the vendored scripts and map that initGlobe asks for', () => {
        const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
        for (const file of ['js/d3-array.min.js', 'js/d3-geo.min.js', 'js/topojson-client.min.js', 'js/countries-110m.json']) {
            expect(app, file).toContain(`'${file}'`);
            expect(fs.existsSync(path.join(root, file)), file).toBe(true);
        }
    });
});
