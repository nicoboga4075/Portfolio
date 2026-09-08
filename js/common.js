/* Shared helpers loaded before both default.js (light pages) and main.js
   (index/blog). Code that was identical (or trivially reconcilable) in both. */

const appName = 'Portfolio';

const appDefaultRoutes = {
    "policy": "/{lng}/policy",
    "terms": "/{lng}/terms",
    "error404": "/404"
};

// Light pages only ever match the appDefaultRoutes entries; index/blog also need
// "index"/"blog". The superset is safe on light pages: their paths cannot match
// the "/{lng}" or "/{lng}/blog" patterns anyway.
const appRoutes = {
    "index": "/{lng}",
    "blog": "/{lng}/blog",
    ...appDefaultRoutes
};

// The site is deployed under the "default" language (the Netlify default);
// "author" is the author's own language. Both are set in .eleventy.js and
// rendered onto <html> by _includes/base.njk.
const langNetlify = document.documentElement.dataset.defaultLang;
const langAuthor = document.documentElement.dataset.authorLang;
const appLanguages = new Set(document.documentElement.dataset.languages.split(' '));
const appRoot = `/${langNetlify}`;

// Profile / CV facts, rendered into the page by fillCareerCounts and initProfile (main.js).
const xp = 5;
const email = 'nicolas.bogalheiro@gmail.com';
const city = 'Paris';
const dateBirth = '1997-11-19';
const cdiCount = 4;
const internshipsCount = 3;
const certifsCount = 5;
const projectsCount = 20;
const experiencesCount = 6;
const countriesCount = 15;

function getCurrentRoute() {
    const path = window.location.pathname;
    return Object.keys(appRoutes).find(key => {
        const pattern = '^' + appRoutes[key].replace('{lng}', '[a-z]{2}') + '/?$';
        return new RegExp(pattern).test(path);
    }) || 'error404';
}

function getHashFromSession() {
    return sessionStorage.getItem('currentHash');
}

function getCurrentLanguage() {
    return document.documentElement.lang;
}

function capitalize(string, locale, allWords = true) {
    if (!allWords) {
        return string.charAt(0).toLocaleUpperCase(locale) + string.slice(1);
    }
    return string.split(' ').map(word => {
        if (word.length === 0) return word;
        const first = word[0].toLocaleUpperCase(locale);
        const remaining = word.slice(1).toLocaleLowerCase(locale);
        return first + remaining;
    }).join(' ');
}

// `date` is anything `new Date()` accepts: an ISO string ("2025-07-26",
// "2026-05-24T13:48:02Z") or a timestamp (Date.now()); omitted -> now.
// `options` is forwarded to toLocaleString. For 2000-01-01 13:05:09, en / fr:
//   dateStyle: 'full'    "Saturday, January 1, 2000"     "samedi 1 janvier 2000"
//              'long'     "January 1, 2000"              "1 janvier 2000"
//              'medium'   "Jan 1, 2000"                  "1 janv. 2000"
//              'short'    "1/1/00"                       "01/01/2000"
//   timeStyle: 'full'    "1:05:09 PM <timezone name>"    "13:05:09 <nom du fuseau>"
//              'long'     "1:05:09 PM UTC"               "13:05:09 UTC"
//              'medium'   "1:05:09 PM"                   "13:05:09"
//              'short'    "1:05 PM"                       "13:05"
// Combined, the date/time connector follows dateStyle: 'full'/'long' -> " at " / " à ", 'medium'/'short' -> ", " (en) / ", " or " " (fr).
function convertDate(date, lang, options = { dateStyle: 'long' }, capitalized = true) {
    const text = new Date(date ?? Date.now()).toLocaleString(lang, options);
    return capitalized ? capitalize(text, lang) : text;
}

function getCurrentFullDate(lang, withTime = true) {
    return convertDate(Date.now(), lang, {
        dateStyle: 'short',
        ...(withTime && { timeStyle: 'medium' })
    }, false);
}

// Inverse of convertDate. `text` is a written date in `lang` (as produced by
// convertDate with dateStyle 'long'), optionally with a time; matching is
// case-insensitive. For 2000-01-01 13:05, en / fr:
//   "January 1, 2000"             "1 janvier 2000"          -> "01/01/2000"
//   "January 1, 2000 at 1:05 PM"  "1 janvier 2000 à 13:05"  -> "01/01/2000 13:05"
// With `iso: true`: "2000-01-01" / "2000-01-01T13:05". The time part is kept
// only if present, converted to 24h unless `hour12` is true (ignored when iso).
function parseDate(text, lang, iso = false, hour12 = false) {
    const months = Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 15).toLocaleDateString(lang, { month: 'long' }).toLocaleLowerCase(lang)
    );
    const parts = text.toLocaleLowerCase(lang).replace(',', '').split(' ');
    const month = String(months.indexOf(parts.find(part => isNaN(part))) + 1).padStart(2, '0');
    const day = parts.find(part => Number(part) <= 31).padStart(2, '0');
    const year = parts.find(part => Number(part) > 31);

    let time = '';
    const clock = parts.find(part => /^\d{1,2}:\d{2}/.test(part));
    if (clock) {
        const meridiem = parts.find(part => part === 'am' || part === 'pm');
        if (hour12 && meridiem && !iso) {
            time = `${clock} ${meridiem.toUpperCase()}`;
        } else {
            const [hour, minute, second] = clock.split(':');
            const hour24 = meridiem ? Number(hour) % 12 + (meridiem === 'pm' ? 12 : 0) : Number(hour);
            time = `${String(hour24).padStart(2, '0')}:${minute}` + (second ? `:${second}` : '');
        }
    }

    return iso
        ? `${year}-${month}-${day}` + (time ? `T${time}` : '')
        : `${day}/${month}/${year}` + (time ? ` ${time}` : '');
}

function switchLanguage(url, langOrigin = langNetlify, langTarget = langAuthor) {
    try {
        const urlObj = new URL(url, window.location.origin);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0 && appLanguages.has(pathParts[0])) {
            pathParts[0] = pathParts[0] === langOrigin ? langTarget : langOrigin;
            urlObj.pathname = `/${pathParts.join('/')}`;
            const hash = getHashFromSession();
            urlObj.hash = (hash && /^[\w-]+$/.test(hash)) ? `#${hash}` : '';
            return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }
        throw new Error("Language not recognized in URL");
    } catch (error) {
        console.error(error);
        return appDefaultRoutes['error404'];
    }
}

function initTranslator() {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.checked = getCurrentLanguage() == langAuthor;
        toggle.addEventListener('change', function () {
            toggle.checked = getCurrentLanguage() == langAuthor;
            const newUrl = switchLanguage(window.location.href);
            if (/^\/(?!\/)/.test(newUrl)) {
                window.location.href = newUrl;
            }
        });
    }
}

function loadImages(selector, extension, one = false) {
    const imgs = document.querySelectorAll(`${selector}`);
    Array.from(imgs).some((el, index) => {
        const locationImg = `images/${el.id}.${extension}`;
        if (el.tagName.toLowerCase() === 'img') {
            el.src = locationImg;
        } else {
            el.style.backgroundImage = `url(${locationImg})`;
        }
        // If first iteration, return true to stop further iteration
        return index === 0 && one;
    });
}

function fillCareerCounts() {
    const cdiCountEl = document.getElementById('cdiCount');
    if (cdiCountEl) {
        cdiCountEl.textContent = cdiCount;
    }
    const internshipsCountEl = document.getElementById('internshipsCount');
    if (internshipsCountEl) {
        internshipsCountEl.textContent = internshipsCount;
    }
}

function initCareerAnimation() {
    const container = document.querySelector('.animation-container');
    const car = document.getElementById('car');
    if (!container || !car) {
        return;
    }
    const updateCarPosition = () => {
        const rect = container.getBoundingClientRect();
        const progress = Math.min(Math.max((window.innerHeight / 2 - rect.top) / rect.height, 0), 1);
        car.style.setProperty('--car-offset', `${progress * rect.height}px`);
    };
    window.addEventListener('scroll', updateCarPosition, { passive: true });
    window.addEventListener('resize', updateCarPosition);
    updateCarPosition();
}

// No argument: apply the stored preference (on page load). With an event (the
// #dark-icon button's onclick): flip the stored preference first, then apply.
// Fires `darkmodechange` so main.js can recolour the skills chart.
function toggleDarkMode(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true');
    }
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark-mode', isDark);
    // #dark-icon only exists on index/blog (in the navbar); no-op elsewhere.
    const icon = document.getElementById('dark-icon');
    if (icon) {
        icon.className = isDark ? 'icon-moon-o' : 'icon-sun-o';
    }
    document.dispatchEvent(new CustomEvent('darkmodechange'));
}

function addRedirectById(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        return;
    }
    const path = appRoutes[elementId];
    el.setAttribute('href', path ? path.replace('{lng}', getCurrentLanguage()) : appRoot);
    el.addEventListener('click', function () {
        sessionStorage.clear(); // Reset hash for all other links
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .catch(error => console.error(error));
    }
}

// Run on every page as soon as this (deferred) script loads.
registerServiceWorker();
toggleDarkMode();
