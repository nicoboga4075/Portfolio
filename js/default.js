function initArticle() {
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    initTranslator();
    addRedirectById('index');
    initCareerAnimation();
    fillCareerCounts();
}

function initPage() {
    loadImages('.icon.svg', 'svg');
    initTranslator();
    addRedirectById('index');
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
