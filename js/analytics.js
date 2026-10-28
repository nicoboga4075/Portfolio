// Google Analytics (gtag.js), included by _includes/base.njk only in the Netlify production build: nothing is sent to Google before the visitor accepts in the consent banner of _includes/footer.html.
const gaId = document.currentScript?.dataset.gaId;
// The visitor's choice in localStorage, 'granted' or 'denied' with the time it was made
const consentKey = 'analytics-consent';
// A choice is kept 6 months, as the CNIL recommends, then the banner asks again
const consentDuration = 182 * 24 * 60 * 60 * 1000;
// The _ga cookies last 13 months at most, the limit of the CNIL (gtag.js defaults to 2 years)
const cookieExpires = 395 * 24 * 60 * 60;
const consentBanner = document.getElementById('consent-banner');

function readConsent() {
    try {
        const stored = JSON.parse(localStorage.getItem(consentKey));
        return stored && Date.now() - stored.date < consentDuration ? stored.value : null;
    } catch {
        // A blocked storage or a value that isn't JSON: the banner asks again
        return null;
    }
}

function saveConsent(value) {
    try {
        localStorage.setItem(consentKey, JSON.stringify({ value, date: Date.now() }));
    } catch {
        // A blocked storage: the choice holds for this page only
    }
}

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

function chooseConsent(value) {
    saveConsent(value);
    consentBanner.hidden = true;
    if (value === 'granted') {
        loadAnalytics();
    } else {
        removeAnalytics();
    }
}

if (gaId && consentBanner) {
    consentBanner.querySelectorAll('[data-consent]').forEach(button => {
        button.addEventListener('click', () => chooseConsent(button.dataset.consent));
    });
    // The "Manage cookies" button of the footer shows the banner again, its first button focused for the keyboard
    document.getElementById('consent-manage')?.addEventListener('click', () => {
        consentBanner.hidden = false;
        consentBanner.querySelector('[data-consent]').focus();
    });
    const consent = readConsent();
    if (consent === 'granted') {
        // After the page has finished loading, as before the banner
        window.addEventListener('load', loadAnalytics);
    } else if (consent === null) {
        consentBanner.hidden = false;
    }
}
