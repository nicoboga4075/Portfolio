// The experiences of api/experiences.json, which the build writes from _data/resume.json for the chatbot (git-ignored, so the spec is in BUILT of playwright.config.js and runs after build.setup.js): each one with its period, and at the top the experiences going on and the longest job, so the bot needs no hand-written instruction about them.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const experiencePeriod = require('../../experience-period');

const root = path.join(__dirname, '..', '..');
const resume = JSON.parse(fs.readFileSync(path.join(root, '_data', 'resume.json'), 'utf8'));

test.describe('api/experiences.json', () => {
    test('hands every experience of the resume in its order, with its dates in every language, its period and its contracts', () => {
        // Read in the test, not when the spec is loaded: Playwright loads every spec before build.setup.js writes the file
        const api = JSON.parse(fs.readFileSync(path.join(root, 'api', 'experiences.json'), 'utf8'));
        expect(api.experiences.map(experience => experience.company)).toEqual(resume.experiences.map(experience => experience.company));
        for (const [index, source] of resume.experiences.entries()) {
            const experience = api.experiences[index];
            expect(experience.date).toEqual({ en: source.date.en, fr: source.date.fr });
            expect(experience).toMatchObject(experiencePeriod(source.date.en, 'en'));
            expect(experience.type.fr).toEqual([source.type].flat().map(type => resume.fr.types[type]));
            expect(Object.keys(experience.details.en)).toEqual(Object.keys(source.details?.en ?? {}));
        }
    });

    test('names the experiences going on and the longest job, the other experiences left out', () => {
        const api = JSON.parse(fs.readFileSync(path.join(root, 'api', 'experiences.json'), 'utf8'));
        expect(api.current).toEqual(api.experiences.filter(experience => experience.ongoing).map(experience => experience.company));
        const jobs = api.experiences.filter(experience => !experience.type.en.every(type => type === resume.en.types.other));
        expect(api.longest.months).toBe(Math.max(...jobs.map(job => job.months)));
        expect(jobs.find(job => job.company === api.longest.company).months).toBe(api.longest.months);
    });
});
