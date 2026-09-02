function addHomeRedirect() {
    const homeBalise = document.getElementById('index');
    if (homeBalise) {
        homeBalise.href = `/${getCurrentLanguage()}`;
        homeBalise.addEventListener('click', function () {
            sessionStorage.clear();
        });
    }
}

function switchLanguage(url) {
    try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.pathname = urlObj.pathname.replace(/^\/(fr|en)/, (match) => {
            return match === '/fr' ? '/en' : '/fr';
        });
        const currentHash = getHashFromSession();
        if (currentHash && /^[a-zA-Z0-9-_]+$/.test(currentHash)) {
            urlObj.hash = `#${currentHash}`;
        } else {
            urlObj.hash = '';
        }
        return urlObj.pathname + urlObj.search + urlObj.hash;
    } catch (error) {
        console.error(error);
        return '/';
    }
}

function initTranslator() {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.checked = getCurrentLanguage() == 'fr';
        toggle.addEventListener('change', function () {
            toggle.checked = getCurrentLanguage() == 'fr';
            const newUrl = switchLanguage(window.location.href);
            if (/^\/(?!\/)/.test(newUrl)) {
                window.location.href = newUrl;
            }
        });
    }
}

function applyDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark-mode', isDark);
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

function initArticle() {
    applyDarkModePreference();
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    initTranslator();
    addHomeRedirect();
    initCareerAnimation();
    fillCareerCounts();
}

function initPage() {
    applyDarkModePreference();
    loadImages('.icon.svg', 'svg');
    initTranslator();
    addHomeRedirect();
    const idPage = getCurrentRoute();
    if (idPage in appDefaultRoutes) {
        document.body.classList.add('text-center');
    }
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
        });
    });
}
