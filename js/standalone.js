// standalone: false when injected into the blog page (js/app.js), whose own flow already refreshes the language switcher (saveHashToSession) and the career counts (initProfile) right around this call.
function initArticle(standalone = true) {
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    if (standalone) {
        initTranslator();
        fillCareerCounts();
    }
}

// Guarded: on the blog page, app.js's own (richer) initPage() already ran via <body onload> before standalone.js ever loads.
if (typeof initPage !== 'function') {
    window.initPage = function () {
        loadImages('.icon.svg', 'svg');
        initTranslator();
        document.querySelectorAll('a[href="#"]').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
            });
        });
    };
}
