function initArticle() {
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    initTranslator();
    fillCareerCounts();
}

function initPage() {
    loadImages('.icon.svg', 'svg');
    initTranslator();
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
        });
    });
}
