/* Shared helpers loaded before both default.js (light pages) and main.js
   (index/blog). Code that was identical (or trivially reconcilable) in both. */

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

// "en" is the language the site is deployed under (the Netlify default);
// "fr" is the author's own language.
const langNetlify = "en";
const langAuthor = "fr";
const appLanguages = new Set([langNetlify, langAuthor]);

// Profile / CV facts, rendered into the page by initProfile (main.js) and fillCareerCounts (default.js).
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
