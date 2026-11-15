// The cookie consent of every page (the banner of _includes/footer.html): one choice per category of the banner, audience measurement (analytics, production build only) and the third-party services (services: the Google scripts of the contact form, Calendly and Botpress), refused until the visitor allows it; the other scripts ask hasConsent or whenConsented, and listen to the consentchange event of document.
// The choices in localStorage, one boolean per category with the time they were made
const consentKey = 'consent';
// The single choice of the banner of Google Analytics alone, which the categories replace: removed, and the banner asks again since what it covers changed
const legacyConsentKey = 'analytics-consent';
// A choice is kept 6 months, as the CNIL recommends, then the banner asks again
const consentDuration = 182 * 24 * 60 * 60 * 1000;
const consentBanner = document.getElementById('consent-banner');
// The categories the banner offers, from its checkboxes
const consentCategories = consentBanner ? Array.from(consentBanner.querySelectorAll('input[name="consent"]'), input => input.value) : [];

function readConsent() {
    try {
        localStorage.removeItem(legacyConsentKey);
        const stored = JSON.parse(localStorage.getItem(consentKey));
        return stored && Date.now() - stored.date < consentDuration ? stored : null;
    } catch {
        // A blocked storage or a value that isn't JSON: the banner asks again
        return null;
    }
}

let consentChoices = readConsent();

function hasConsent(category) {
    return consentChoices?.[category] === true;
}

// Stores the choices, hides the banner and tells the scripts of the page
function saveConsent(choices) {
    consentChoices = choices;
    try {
        localStorage.setItem(consentKey, JSON.stringify({ ...choices, date: Date.now() }));
    } catch {
        // A blocked storage: the choices hold for this page only
    }
    consentBanner.hidden = true;
    document.dispatchEvent(new CustomEvent('consentchange', { detail: { ...choices } }));
    runPendingConsent();
}

// Every category of the banner allowed (true), refused (false), or as its checkbox is ticked (null)
function chooseConsent(allowed) {
    const choices = {};
    consentCategories.forEach(category => {
        choices[category] = allowed ?? consentBanner.querySelector(`input[value="${category}"]`).checked;
    });
    saveConsent(choices);
}

// Shows the banner with the current choices ticked, the focus on the checkbox of a category or on its first button
function showConsentBanner(category) {
    consentBanner.querySelectorAll('input[name="consent"]').forEach(input => {
        input.checked = hasConsent(input.value);
    });
    consentBanner.hidden = false;
    const checkbox = category && consentBanner.querySelector(`input[value="${category}"]`);
    (checkbox || consentBanner.querySelector('[data-consent]')).focus();
}

// The action waiting for the next choice of the banner, the last one asked for only, so a button clicked twice runs once
let pendingConsent = null;

// Runs the callback at once when the category is allowed, otherwise asks for it in the banner and runs it only if the visitor allows it there
function whenConsented(category, callback) {
    if (hasConsent(category)) {
        callback();
        return;
    }
    if (!consentBanner) {
        return;
    }
    pendingConsent = { category, callback };
    showConsentBanner(category);
}

// The next choice runs the waiting action if it allows its category, and drops it otherwise
function runPendingConsent() {
    const pending = pendingConsent;
    pendingConsent = null;
    if (pending && hasConsent(pending.category)) {
        pending.callback();
    }
}

if (consentBanner) {
    consentBanner.querySelectorAll('[data-consent]').forEach(button => {
        const allowed = { granted: true, denied: false }[button.dataset.consent] ?? null;
        button.addEventListener('click', () => chooseConsent(allowed));
    });
    // The "Manage cookies" button of the footer shows the banner again
    document.getElementById('consent-manage')?.addEventListener('click', () => showConsentBanner());
    // A button next to what a category runs (the contact form) allows that category alone, the others kept
    document.querySelectorAll('[data-consent-grant]').forEach(button => {
        button.addEventListener('click', () => saveConsent({ ...consentChoices, [button.dataset.consentGrant]: true }));
    });
    if (consentChoices === null) {
        consentBanner.hidden = false;
    }
}
