// Google Analytics (gtag.js), included by _includes/base.njk only in the Netlify production build: nothing is sent to Google before the visitor allows audience measurement in the consent banner of _includes/footer.html, whose choices js/consent.js keeps.
const gaId = document.currentScript?.dataset.gaId;
// The _ga cookies last 13 months at most, the limit of the CNIL (gtag.js defaults to 2 years)
const cookieExpires = 395 * 24 * 60 * 60;

function loadAnalytics() {
    // Accepted again after a refusal on the same page: gtag.js is already there, only switched off
    if (window.gtag) {
        window[`ga-disable-${gaId}`] = false;
        return;
    }
    window.dataLayer = window.dataLayer || [];
    // gtag.js reads the arguments object itself, not an array: keep `arguments`
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { cookie_expires: cookieExpires });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
}

// Stops gtag.js if it was loaded, and deletes the _ga cookies it set, on the host and on the domain gtag.js gives them
function removeAnalytics() {
    window[`ga-disable-${gaId}`] = true;
    document.cookie.split(';').map(cookie => cookie.split('=')[0].trim()).filter(name => name.startsWith('_ga')).forEach(name => {
        document.cookie = `${name}=; max-age=0; path=/`;
        document.cookie = `${name}=; max-age=0; path=/; domain=${location.hostname}`;
    });
}

if (gaId) {
    // Each choice of the banner of js/consent.js: gtag.js loaded on an Accept, switched off with its cookies deleted on a refusal
    document.addEventListener('consentchange', event => {
        if (event.detail.analytics) {
            loadAnalytics();
        } else {
            removeAnalytics();
        }
    });
    if (hasConsent('analytics')) {
        // After the page has finished loading, as before the banner
        window.addEventListener('load', loadAnalytics);
    }
}
