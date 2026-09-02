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

const cdiCount = 4;
const internshipsCount = 3;

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
