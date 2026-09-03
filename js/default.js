function addHomeRedirect() {
    const homeBalise = document.getElementById('index');
    if (homeBalise) {
        homeBalise.href = `/${getCurrentLanguage()}`;
        homeBalise.addEventListener('click', function () {
            sessionStorage.clear();
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
