/* Shared helpers loaded before both standalone.js (light pages) and app.js
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

// The languages the switcher offers (rendered by Eleventy from package.json routes).
const appLanguages = new Set(
    Array.from(document.querySelectorAll('#language-switcher [hreflang]'), a => a.hreflang)
);

// Profile / CV facts, rendered into the page by fillCareerCounts and initProfile (app.js).
const xp = 5;
const email = 'nicolas.bogalheiro@gmail.com';
const address = 'Paris';
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
function convertDate(date, lang, options, capitalized = true) {
    const text = new Date(date ?? Date.now()).toLocaleString(lang, options ?? { dateStyle: 'long' });
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
    const month = String(months.indexOf(parts.find(part => Number.isNaN(Number(part)))) + 1).padStart(2, '0');
    const day = parts.find(part => Number(part) <= 31).padStart(2, '0');
    const year = parts.find(part => Number(part) > 31);
    const date = iso ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;

    const clock = parts.find(part => /^\d{1,2}:\d{2}/.test(part));
    if (!clock) {
        return date;
    }

    const meridiem = parts.find(part => part === 'am' || part === 'pm');
    if (hour12 && meridiem && !iso) {
        return `${date} ${clock} ${meridiem.toUpperCase()}`;
    }

    const [hour, minute, second] = clock.split(':');
    let hour24 = Number(hour);
    if (meridiem) {
        hour24 = hour24 % 12 + (meridiem === 'pm' ? 12 : 0);
    }
    const time = `${String(hour24).padStart(2, '0')}:${minute}` + (second ? `:${second}` : '');
    return iso ? `${date}T${time}` : `${date} ${time}`;
}

// Same path, first segment swapped to langTarget. Keeps the remembered #hash.
function switchLanguage(url, langTarget) {
    try {
        const urlObj = new URL(url, window.location.origin);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0 && appLanguages.has(pathParts[0])) {
            pathParts[0] = langTarget;
            urlObj.pathname = `/${pathParts.join('/')}`;
            // initTranslator() runs (and bakes this href) before the page's own
            // init saves the *current* hash to session - e.g. on the blog page,
            // before initBlogPage() has saved the article slug - so the session
            // value can still be stale (a leftover nav-link section hash). The
            // hash already on `url` (read before clearUrlPath() strips it) is
            // always the current page's real hash; prefer it.
            const urlHash = urlObj.hash ? urlObj.hash.slice(1) : '';
            const hash = urlHash || getHashFromSession();
            urlObj.hash = (hash && /^[\w-]+$/.test(hash)) ? `#${hash}` : '';
            return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }
        throw new Error("Language not recognized in URL");
    } catch (error) {
        console.error(error);
        return appDefaultRoutes['error404'];
    }
}

// #language-switcher (language-switcher.html) lists every language, each already
// carrying a crawlable href to this page in that language. Mark the current one
// and refresh every link's href (including the current one) with the remembered #hash.
function initTranslator() {
    const currentLang = getCurrentLanguage();
    document.querySelectorAll('#language-switcher [hreflang]').forEach(link => {
        const isCurrent = link.hreflang === currentLang;
        link.classList.toggle('on', isCurrent);
        if (isCurrent) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
        // Refresh the server-rendered href with the remembered #hash; keep it
        // untouched if the URL can't be parsed (switchLanguage returns /404).
        const target = switchLanguage(window.location.href, link.hreflang);
        if (target !== appDefaultRoutes['error404']) {
            link.href = target;
        }
    });
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

// No argument: apply the stored preference (on page load). With an event (the
// #dark-icon button's onclick): flip the stored preference first, then apply.
// Fires `darkmodechange` so app.js can recolour the skills chart.
function toggleDarkMode(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        localStorage.setItem('darkMode', localStorage.getItem('darkMode') !== 'true');
    }
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark-mode', isDark);
    // Pages with the icon font (assets set in front matter) swap the icon-*
    // class; others fall back to a sun/moon emoji, same split as footer.html's
    // icon-heart/icon-shield vs their emoji equivalents.
    const icon = document.getElementById('dark-icon');
    if (icon?.dataset.iconMode === 'emoji') {
        icon.textContent = isDark ? '🌙' : '☀️';
    } else if (icon) {
        icon.className = isDark ? 'icon-moon-o' : 'icon-sun-o';
    }
    document.dispatchEvent(new CustomEvent('darkmodechange'));
}

function addRedirectById(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        return;
    }
    const currentLang = getCurrentLanguage();
    const path = appRoutes[elementId];
    el.setAttribute('href', path ? path.replace('{lng}', currentLang) : `/${currentLang}`);
    // Self-links for policy/terms keep a real (crawlable) href but are marked current instead of getting the click handler below.
    if (elementId in appDefaultRoutes && elementId === getCurrentRoute()) {
        el.setAttribute('aria-current', 'page');
        return;
    }
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

function hideLoader() {
    document.getElementById('ftco-loader')?.classList.remove('show');
}

function setCopyrightYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// Run on every page as soon as this (deferred) script loads.
registerServiceWorker();
toggleDarkMode();
hideLoader();
setCopyrightYear();
Object.keys(appRoutes).forEach(addRedirectById);
