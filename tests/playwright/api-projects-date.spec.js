// The period of each project in api/projects.json, which the build writes from _data/projects.json for the chatbot (git-ignored, so the spec is in BUILT of playwright.config.js and runs after build.setup.js).
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const cards = JSON.parse(fs.readFileSync(path.join(root, '_data', 'projects.json'), 'utf8')).cards;
const api = JSON.parse(fs.readFileSync(path.join(root, 'api', 'projects.json'), 'utf8'));

test.describe('api/projects.json period', () => {
    test('hands the period of each card in every language, or null for a card without a date', () => {
        expect(api.projects.map(project => project.id)).toEqual(cards.map(card => card.id));
        for (const card of cards) {
            const project = api.projects.find(entry => entry.id === card.id);
            if (card.date) {
                expect(project.date).toEqual({ en: card.date.en, fr: card.date.fr });
            } else {
                expect(project.date).toBeNull();
            }
        }
    });
});
