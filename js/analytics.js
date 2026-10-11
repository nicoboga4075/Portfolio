// Google Analytics (gtag.js), included by _includes/base.njk only in the Netlify production build, and loaded after the page has finished loading.
const gaId = document.currentScript?.dataset.gaId;

if (gaId) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js reads the arguments object itself, not an array: keep `arguments`
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId);

    window.addEventListener('load', () => {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        document.head.appendChild(script);
    });
}
