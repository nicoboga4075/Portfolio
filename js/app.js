const appHomeSection = "home-section";
const appProjectSection = "projects-section";
const appBlogSection = "blog-section";
const appContactSection = "contact-section";

const appMainSections = [
    "about-section",
    "resume-section",
    "services-section",
    appProjectSection,
    appBlogSection,
    appContactSection
];

const appSubSections = new Set([
    "education",
    "experiences",
    "skills",
    "languages",
    "awards"
]);

const appSecondarySections = [
    "counter-section",
    "carousel-section"
];

const appAllSections = [
    appHomeSection,
    ...appMainSections,
    ...appSubSections,
    ...appSecondarySections
];

const appSkills = [
    "hard-skills",
    "soft-skills",
    "mad-skills"
];

const appArticles = JSON.parse($('meta[name="articles"]').attr('content'));

const appKeywords = [
    // Frontend
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "Next.js",
    "Vue.js",
    "Nuxt.js",
    "React",
    "Angular",
    "Bootstrap",
    // Backend
    "C",
    "C#",
    "C++",
    ".NET",
    ".NET Core",
    ".NET Framework",
    "Node",
    "Express.js",
    "PHP",
    "Laravel",
    "Symfony",
    "Python",
    "Django",
    "FastAPI",
    "Flask",
    "Delphi",
    "Pascal",
    "Ruby",
    "Ruby on Rails",
    "Java",
    "Spring",
    "Spring Boot",
    "Hibernate",
    // Database
    "MySQL",
    "Entity Framework",
    "PostgreSQL",
    "MongoDB",
    "SQLite",
    "SQL",
    "NoSQL",
    "Oracle",
    "Cassandra",
    "Neo4j",
    "Firebase",
    "Elasticsearch",
    "Supabase",
    "SQL Server",
    // Tools & Deployment
    "Git",
    "GitHub",
    "GitLab",
    "Git Bash",
    "Bitbucket",
    "SVN",
    "Gitea",
    "Source Tree",
    "Kibana",
    "Fork",
    "CI/CD",
    "CI",
    "CD",
    "VM",
    "Artifactory",
    "JFrog",
    "Docker",
    "Vercel",
    "Netlify",
    "AWS",
    "Heroku",
    "DigitalOcean",
    "Cloudflare",
    "Google Analytics",
    // Big Data & Visualization
    "Spark",
    "Hadoop",
    "HDFS",
    "DataViz",
    "Cycle en V",
    "V Model",
    "CRM",
    "Warehouse",
    "Grafana",
    "Tensorflow",
    "Snowflake",
    "Power BI",
    // Mobile & API
    "React Native",
    "Xamarin",
    "Expo",
    "Android",
    "Samsung",
    "Play Store",
    "Apple Store",
    "Apple",
    "IOS",
    "Flutter",
    "REST",
    "API",
    "REST API",
    "API REST",
    "GraphQL",
    // UI/UX & Design
    "Figma",
    "Adobe",
    "Canva",
    "UI/UX",
    "UI",
    "UX",
    "Design",
    "Responsive Design",
    // Concepts & Good pratices
    "SEO",
    "Docstring",
    "Framework",
    "ORM",
    "MVC",
    "MTV",
    "Template",
    "Model",
    "View",
    "Controller",
    "Pattern",
    "Microservice",
    "Monolitique",
    "Monolithic",
    "Package",
    "Module",
    "Performance",
    "Clean Code",
    "Design Patterns",
    "Agile",
    "Scrum",
    "Singleton",
    "TDD",
    // Tests
    "Jest",
    "Pytest",
    "Unittest ",
    "Cypress",
    "Playwright",
    "Robot Framework",
    "Selenium",
    "Postman",
    "PowerShell",
    // OS
    "Windows",
    "Linux",
    "Unix",
    "Mac",
    "Debian",
    "Ubuntu",
    "Mac OS",
    "Kernel",
    // Cyber
    "OWASP",
    "JWT",
    "OAuth2",
    "HTTP",
    "HTTPS",
    "CSP",
    "VPN",
    "Fortinet",
    "Helmet.js",
    "CSRF",
    "XSS",
    "SQL Injection",
    "Injection SQL",
    "SQLi",
    "Nginx",
    "Apache",
    "Kerberos",
    "XAMPP",
    "SSL",
    "TLS",
    "SNMP",
    "SFTP",
    "Burp Suite",
    "Bash",
    "Kali",
    "CMD",
    "Avast",
    "Metasploit",
    "Nmap",
    "Wireshark",
    "HSM",
    "Snyk",
    // Social Media & Recruitment
    "Welcome to the Jungle",
    "Indeed",
    "LinkedIn",
    "YouTube",
    "Instagram",
    "Red Hat",
    "Facebook",
    "Whatsapp",
    "Messenger",
    "Twitter",
    "X",
    "Snapchat",
    "Tik Tok",
    "Le Wagon",
    "Medium",
    "Survey Magazine",
    "OpenClassrooms",
    // Main Cities, from config.authorCities of package.json (the author-cities meta of base.njk)
    ...JSON.parse($('meta[name="author-cities"]').attr('content')),
    // Editor Softwares
    "Ethnos",
    "Web Reports",
    "Net-Survey",
    "Mobi-Survey",
    "Teexma",
    // Browsers
    "Google Chrome",
    "Chrome",
    "Chromium",
    "Brave",
    "Opera",
    "Google",
    "Mozilla",
    "Firefox",
    "Mozilla Firefox",
    "Safari",
    "Ecosia",
    "Edge",
    "Microsoft",
    "Microsoft Edge",
    "Internet Explorer",
    "IE",
    "Internet"
];

// Visitor-facing strings needed at runtime (app.js only - standalone.js pages don't load i18next), authored once in _data/messages.json and embedded by base.njk into the <meta name="i18n-messages"> tag (same pattern as appArticles below). Page language is fixed server-side (separate _en/_fr builds), so init runs synchronously (initImmediate: false) and getMessage() can call t() right away without awaiting the init promise.
const appI18nMessages = JSON.parse($('meta[name="i18n-messages"]').attr('content'));
const appI18nResources = Object.keys(appI18nMessages).reduce((resources, key) => {
    Object.entries(appI18nMessages[key]).forEach(([lng, value]) => {
        resources[lng] ??= { translation: {} };
        resources[lng].translation[key] = value;
    });
    return resources;
}, {});

i18next.init({
    lng: getCurrentLanguage(),
    fallbackLng: false,
    initImmediate: false,
    resources: appI18nResources
});

function getMessage(key) {
    return i18next.t(key);
}

// The modes a link turns on with ?mode=<name>, each with the message of its banner in _data/messages.json; a ?mode without a name turns on the default one, first (a link shared to someone opening the site for the first time)
const appModes = { first: 'welcome-banner' };
const appDefaultMode = 'first';

// A visitor whose address holds ?mode=<name> gets that mode: remembered in localStorage (sessionStorage is cleared by the navigation links), a new link replacing the mode kept and bringing back a banner closed earlier; the marker taken out of the address, even for a name that is no mode; a <name>-mode class on the body and the banner of the mode until its close button is clicked; storage may be blocked (private mode), and the page then works without the mode
function initMode() {
    const params = new URLSearchParams(window.location.search);
    let mode;
    let closed;
    try {
        if (params.has('mode')) {
            const asked = params.get('mode') || appDefaultMode;
            if (Object.hasOwn(appModes, asked)) {
                localStorage.setItem('mode', asked);
                localStorage.removeItem('modeBanner');
            }
            params.delete('mode');
            const query = params.toString();
            history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
        }
        mode = localStorage.getItem('mode');
        // No mode, or one a later version of the site no longer has
        if (!Object.hasOwn(appModes, mode ?? '')) {
            return;
        }
        closed = localStorage.getItem('modeBanner') === 'closed';
    } catch {
        return;
    }
    document.body.classList.add(`${mode}-mode`);
    if (closed) {
        return;
    }
    const banner = document.createElement('div');
    banner.id = 'mode-banner';
    banner.dataset.mode = mode;
    banner.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = getMessage(appModes[mode]);
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', getMessage('mode-banner-close'));
    close.textContent = '×';
    close.addEventListener('click', () => {
        banner.remove();
        try {
            localStorage.setItem('modeBanner', 'closed');
        } catch {
            // Storage blocked: the banner comes back on the next page
        }
    });
    banner.append(text, close);
    document.body.prepend(banner);
}

let appGoogleToken;
// The Gmail token given on consent, kept in memory for the next messages sent from the page, never in a storage (CodeQL js/clear-text-storage-of-sensitive-data)
let appGmailToken = null;
const appScrollSections = [];
let appCheckpointSubSection;
let originalArticleContent = '';
let indexSearchOccurence = -1;
let chart;

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

function removeTrailingEquals(string) {
    let end = string.length;
    while (end > 0 && string[end - 1] === '=') {
        end--;
    }
    return string.substring(0, end);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function highlightKeywords(keywords) {
    if (!originalArticleContent) return;
    $('.article-container').html(originalArticleContent);
    $('.article-container').contents().each(function recurse() {
        if (this.nodeType === 3) {
            let text = this.nodeValue;
            keywords.forEach(keyword => {
                const regex = new RegExp(String.raw`(^|\s|[.,!?;:"'()\[\]{}<>])(${escapeRegExp(keyword)})(?=\s|[.,!?;:"'()\[\]{}<>]|$)`, 'gi');
                text = text.replace(regex, (match, p1, p2) => `${p1}<mark class="highlight">${p2}</mark>`);
            });
            if (text !== this.nodeValue) {
                const $frag = $('<span>').html(text);
                $(this).replaceWith($frag);
            }
        } else if (this.nodeType === 1) {
            $(this).contents().each(recurse);
        }
    });
}

// The FAQ accordion (css/standalone.css) hides a closed card's body with display: none, so a mark inside it has no box to scroll to: open its card first.
function scrollToHighlight($mark) {
    $mark.closest('.card').children('input[type="checkbox"]').prop('checked', true);
    $mark.addClass('current-match')[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

function scrollToNextHighlight() {
    const $marks = $('.article-container mark.highlight');
    if ($marks.length === 0) return;
    indexSearchOccurence++;
    if (indexSearchOccurence >= $marks.length) {
        indexSearchOccurence = 0;
    }
    $marks.removeClass('current-match');
    scrollToHighlight($marks.eq(indexSearchOccurence));
}

// initTranslator() only bakes the language-switcher hrefs once, at page load (see its own comment in common.js) - without re-running it here, the switcher keeps pointing at whatever section was current at load time, however far the visitor scrolls afterward. Skip when the hash didn't actually change so scrolling within the same section doesn't re-run it every tick.
function saveHashToSession(hash) {
    if (sessionStorage.getItem('currentHash') === hash) {
        return;
    }
    sessionStorage.setItem('currentHash', hash);
    initTranslator();
}

function clearUrlPath() {
    history.replaceState(null, null, window.location.pathname);
}

function getSlugFromUrl() {
    return window.location.hash.substring(1);
}

function getRecentArticle() {
    const currentSlug = getSlugFromUrl() || getHashFromSession();
    return appArticles.find(article => article.slug !== currentSlug);
}

function getCurrentArticle() {
    const currentSlug = getSlugFromUrl() || getHashFromSession();
    return appArticles.find(article => article.slug === currentSlug);
}

function toggleVisibility(selector, visibleClass = 'd-flex') {
    const $element = $(selector);
    if ($element.is('[hidden]') || $element.hasClass('d-none')) {
        $element.prop('hidden', false).removeClass('d-none').addClass(visibleClass);
    } else {
        $element.prop('hidden', true).removeClass(visibleClass);
    }
}

function lastCvUpdate(lang) {
    const lastUpdateDate = $('#last-update-date');
    fetch(`/.netlify/functions/env?lang=${lang}`)
        .then(res => {
            if (!res.ok) throw new Error("GitHub fetch failed");
            return res.json();
        })
        .then(data => {
            lastUpdateDate.text(convertDate(data.date, lang, { dateStyle: 'short', timeStyle: 'medium' }, false));
        })
        .catch(error => {
            console.error(error);
            lastUpdateDate.text(getCurrentFullDate(lang));
            return false;
        });
}

function loadBingo() {
    let timer = null;
    let number = 0;
    const target = 2713;
    const labelBtn = $('#bingo-btn').text();

    $('#bingo-btn').click(function () {
        if (number === 0) {
            $('#bingo-timer').removeClass('victory defeat');
            $('#bingo-btn').text($('#bingo-btn').data('stop'));
            timer = setInterval(() => {
                number++;
                $('#bingo-timer').text(number);
            }, 10);
        } else {
            // Win or lose, the round ends: stop counting and reset for a replay.
            clearInterval(timer);
            $('#bingo-timer').addClass(number === target ? 'victory' : 'defeat');
            $('#bingo-btn').text(labelBtn);
            number = 0;
        }
    });
}

// Turns a card over when its toggle is clicked (Enter and Space click a button too), and back again: the soft skill cards (a padlock) and the certifications counter (a question mark, data-icons of the button naming its two icons); the hidden back is inert, so its links can't be tabbed to; while a card of a carousel is open the carousel stops sliding, so its back stays on screen
function initFlipCards() {
    $(document).on('click', '.soft-card-toggle', function () {
        const card = $(this).closest('.soft-card');
        const unlocked = !card.hasClass('is-unlocked');
        const [closedIcon, openIcon] = ($(this).data('icons') || 'icon-lock icon-unlock').split(' ');
        card.toggleClass('is-unlocked', unlocked);
        $(this).attr('aria-expanded', String(unlocked)).find('i').toggleClass(closedIcon, !unlocked).toggleClass(openIcon, unlocked);
        card.find('.soft-card-back').attr({ 'aria-hidden': String(!unlocked), inert: unlocked ? null : '' });
        const carousel = card.closest('.owl-carousel');
        carousel.trigger(carousel.find('.soft-card.is-unlocked').length ? 'stop.owl.autoplay' : 'play.owl.autoplay');
    });
}

// A filter button on the back of a counter (a subject of the certifications, a continent of the flags) keeps only the items of its group (data-filter of each item), the one without a group shows them all; the pressed button says so with aria-pressed
function initCounterFilters() {
    $(document).on('click', '.counter-filter button', event => {
        const button = event.currentTarget;
        const { filter } = button.dataset;
        $(button).attr('aria-pressed', 'true').siblings().attr('aria-pressed', 'false');
        // An item may belong to several groups (a job that was an internship then a permanent one), listed in its data-filter
        for (const item of $(button).closest('.soft-card-back').find('li[data-filter]')) {
            item.hidden = Boolean(filter) && !item.dataset.filter.split(' ').includes(filter);
        }
    });
}

// Hovered with a mouse, a counter of #counter-section leans towards the pointer as it moves (at most 8 degrees each way, through the --tilt-x and --tilt-y properties its CSS transform reads, one update per frame), and straightens when the pointer leaves; nothing on touch screens or for visitors who ask for less motion
function initCounterTilt() {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
        return;
    }
    let frame = 0;
    // event.currentTarget is the card the delegated handler matched
    $(document).on('mousemove', '#counter-section .stat-card', event => {
        const { currentTarget: card, clientX, clientY } = event;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            const box = card.getBoundingClientRect();
            const x = (clientX - box.left) / box.width - 0.5;
            const y = (clientY - box.top) / box.height - 0.5;
            card.style.setProperty('--tilt-x', `${(-y * 16).toFixed(1)}deg`);
            card.style.setProperty('--tilt-y', `${(x * 16).toFixed(1)}deg`);
        });
    });
    $(document).on('mouseleave', '#counter-section .stat-card', event => {
        cancelAnimationFrame(frame);
        event.currentTarget.style.removeProperty('--tilt-x');
        event.currentTarget.style.removeProperty('--tilt-y');
    });
}

// A faint blue halo follows the mouse over the whole page (its place in --x and --y, read by its CSS transform) and the mouse drops a lightning spark every 50px it travels, kept calm for the eyes: small zigzags drawn on a canvas the size of the window, at the pixel ratio of the screen so they stay sharp, each drifting slowly off at its own angle (the golden angle from one to the next, no random numbers) and fading out within half a second, at most 8 at a time; the frames run only while a spark is alive, and everything fades out when the pointer leaves the window; nothing on touch screens, for visitors who ask for less motion or without a 2D canvas
function initCursorSparks() {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
        return;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        return;
    }
    const layer = document.createElement('div');
    layer.id = 'cursor-sparks';
    layer.setAttribute('aria-hidden', 'true');
    const halo = document.createElement('div');
    halo.className = 'cursor-halo';
    layer.append(halo, canvas);
    document.body.append(layer);
    const root = getComputedStyle(document.documentElement);
    const colours = ['--yellow', '--orange'].map(name => root.getPropertyValue(name).trim());
    const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * ratio);
        canvas.height = Math.round(window.innerHeight * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    $(window).on('resize', resize);
    let sparks = [];
    let count = 0;
    let frame = 0;
    // Where the last spark was dropped, the first move dropping one
    let last = { x: -Infinity, y: -Infinity };
    const draw = () => {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        sparks = sparks.filter(spark => (spark.life -= 0.04) > 0);
        context.lineWidth = 1.5;
        for (const spark of sparks) {
            spark.x += spark.dx;
            spark.y += spark.dy;
            // A zigzag of two strokes along its way, bent to one side then the other
            context.globalAlpha = spark.life * 0.8;
            context.strokeStyle = spark.colour;
            context.beginPath();
            context.moveTo(spark.x, spark.y);
            context.lineTo(spark.x + spark.dx * 2 + spark.dy, spark.y + spark.dy * 2 - spark.dx);
            context.lineTo(spark.x + spark.dx * 3 - spark.dy, spark.y + spark.dy * 3 + spark.dx);
            context.stroke();
        }
        frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };
    $(document).on('mousemove', event => {
        const { clientX, clientY } = event;
        layer.style.setProperty('--x', `${clientX}px`);
        layer.style.setProperty('--y', `${clientY}px`);
        layer.classList.add('is-visible');
        if (Math.hypot(clientX - last.x, clientY - last.y) < 50) {
            return;
        }
        last = { x: clientX, y: clientY };
        // One spark from the tip of the pointer, the oldest dropped past 8
        const angle = count * 2.4;
        const speed = 0.6 + (count % 3) * 0.3;
        sparks.push({ x: clientX, y: clientY, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, colour: colours[count % 2], life: 1 });
        count++;
        sparks = sparks.slice(-8);
        frame ||= requestAnimationFrame(draw);
    });
    // Leaving the window, the pointer goes out to no element
    $(document).on('mouseout', event => {
        if (!event.relatedTarget) {
            layer.classList.remove('is-visible');
        }
    });
}

// A link of the missions to a project card (#esh) scrolls to the card and opens it as on hover: the focus goes to its Explore button, so :focus-within shows its overlay and the keyboard lands on it too; a link to anything else keeps its default
function initProjectLinks() {
    // The pointer stays where the click was, now over another card: that card ignores it (projects-pinned) until the pointer really moves or the focus leaves, so only the linked card is open
    const unpin = () => document.body.classList.remove('projects-pinned');
    $(document).on('pointermove', event => {
        if (event.originalEvent?.movementX || event.originalEvent?.movementY) {
            unpin();
        }
    });
    $(document).on('click', '.resume-details a[href^="#"]', function (event) {
        const card = $($.attr(this, 'href')).filter('.project');
        if (!card.length) {
            return;
        }
        event.preventDefault();
        document.body.classList.add('projects-pinned');
        // A card not scrolled into view yet is still hidden (visibility: hidden of .ftco-animate), and a hidden button can't take the focus: reveal it first, as the scroll reveal would
        if (!card.hasClass('ftco-animated')) {
            card.addClass('fadeInUp ftco-animated');
        }
        card.one('focusout', unpin);
        $('html, body').animate({ scrollTop: card.offset().top - 70 }, 500, () => {
            card.find('.explore')[0]?.focus({ preventScroll: true });
        });
    });
}

// Opens the certificates of a hard skill in a popover from its PDF icon, since a tooltip can't hold links the pointer can reach: drawn in the body, where the carousel can't clip it, toggled by a click, closed by a click elsewhere or Escape (which gives the focus back to the icon); once open, the focus moves to its first link, so the keyboard reaches them too; the instance is kept as docsPopover, since an element's popover property is the HTML popover attribute
function initDocPopovers() {
    const buttons = $('.hard-skill-docs').each(function () {
        this.docsPopover = new bootstrap.Popover(this, { html: true, container: 'body', boundary: 'window', placement: 'top', trigger: 'manual', content: $(this).next('.hard-skill-docs-list').html() });
    });
    buttons.on('click', function () {
        this.docsPopover.toggle();
    });
    buttons.on('shown.bs.popover', function () {
        this.docsPopover.getTipElement().querySelector('a')?.focus();
    });
    $(document).on('click', event => {
        buttons.each(function () {
            if (!this.contains(event.target) && !$(event.target).closest('.popover').length) {
                this.docsPopover.hide();
            }
        });
    });
    $(document).on('keydown', event => {
        if (event.key !== 'Escape') return;
        buttons.each(function () {
            if (this.docsPopover.getTipElement().isConnected) {
                this.docsPopover.hide();
                this.focus();
            }
        });
    });
}

// Lights the stages of the delivery pipeline one after the other, a stage every 1.2s, back to the first after the last, only while the pipeline is on screen; not started when the visitor asked for reduced motion
function initPipelineLoop() {
    const pipeline = document.querySelector('.pipeline');
    // The webhook between the CI and CD boxes is a stage too: its heartbeat runs once the CI has passed
    const steps = pipeline ? [...pipeline.querySelectorAll('.pipeline-step, .pipeline-link')] : [];
    if (!steps.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    // A stage is one step, or all the branches out of the deploy, lit together
    const stages = [];
    for (const step of steps) {
        const branches = step.closest('.pipeline-branches');
        const last = stages.at(-1);
        if (branches && last?.branches === branches) {
            last.steps.push(step);
        } else {
            stages.push({ branches, steps: [step] });
        }
    }
    const light = (index, on) => stages[index].steps.forEach(step => step.classList.toggle('is-active', on));
    // One glowing stretch for the line, run from the lit stage to the next one, so the eye follows it without a break where the line of one step meets the next; the heartbeat and the fork have their own beat along their drawn paths
    const runner = document.createElement('span');
    runner.className = 'pipeline-runner';
    runner.setAttribute('aria-hidden', 'true');
    pipeline.after(runner);
    // A box from the frame of the runner
    const place = element => {
        const box = element.getBoundingClientRect();
        const frame = runner.parentElement.getBoundingClientRect();
        return { left: box.left - frame.left, right: box.right - frame.left, x: box.left + box.width / 2 - frame.left, y: box.top + box.height / 2 - frame.top };
    };
    // Where the route enters ('in') or leaves ('out') a stage: the centre of its circle, which hides the stretch; for the webhook the start or the end of its beat, and for the branches the trunk of their fork (47px before their first circle, 56px wide, both scaled down alike), where a beat of their own takes over: there the stretch stops, or starts, with its end on the point, half its width away, so it never runs over the drawn path; level with the line (y)
    const point = (index, side, y) => {
        const { branches, steps: [step] } = stages[index];
        const trace = step.querySelector('.pipeline-ecg-trace');
        const box = place(trace ?? step.querySelector('.pipeline-icon') ?? step);
        let { x } = box;
        const half = runner.offsetWidth / 2;
        if (branches) {
            x = box.left - 47 * (box.right - box.left) / 56 - half;
        } else if (trace) {
            x = side === 'out' ? box.right + half : box.left - half;
        }
        return { x, y: y ?? box.y };
    };
    const at = (x, y) => `translate(${x}px, ${y}px)`;
    // Runs the stretch from a stage to the next one in the time of a stage; none on the branches, whose fork has its own beat, nor after another last stage: the loop starts again from the first circle
    const run = index => {
        const { branches, steps: stageSteps } = stages[index];
        if (branches || index === stages.length - 1) {
            return;
        }
        const from = point(index, 'out');
        const to = point(index + 1, 'in', from.y);
        const start = at(from.x, from.y);
        const end = { transform: at(to.x, to.y), opacity: 1 };
        // Out of the webhook the stretch waits, unseen, for the beat to cross the trace in the first half of the stage, then takes over at its end
        const frames = stageSteps[0].querySelector('.pipeline-ecg-trace')
            ? [{ transform: start, opacity: 0 }, { transform: start, opacity: 0, offset: 0.5 }, { transform: start, opacity: 1, offset: 0.5 }, end]
            : [{ transform: start, opacity: 1 }, end];
        runner.animate?.(frames, { duration: 1200, easing: 'linear' });
    };
    let current = 0;
    let timer = null;
    light(current, true);
    new IntersectionObserver(([entry]) => {
        // Off screen: the loop stops where it is and goes on from there when the pipeline comes back
        if (!entry.isIntersecting) {
            clearInterval(timer);
            timer = null;
            return;
        }
        if (timer) {
            return;
        }
        run(current);
        timer = setInterval(() => {
            light(current, false);
            current = (current + 1) % stages.length;
            light(current, true);
            run(current);
        }, 1200);
    }).observe(pipeline);
}

function loadContactScripts() {
    if (loadContactScripts.loaded) {
        return;
    }
    loadContactScripts.loaded = true;
    const gapi = document.createElement('script');
    gapi.src = 'https://apis.google.com/js/api.js';
    gapi.crossOrigin = 'anonymous';
    gapi.onload = gapiLoaded;
    document.body.appendChild(gapi);

    const gsi = document.createElement('script');
    gsi.src = 'https://accounts.google.com/gsi/client';
    gsi.onload = gisLoaded;
    document.body.appendChild(gsi);

    const recaptcha = document.createElement('script');
    recaptcha.src = `https://www.google.com/recaptcha/api.js?hl=${getCurrentLanguage()}&onload=initCaptcha&render=explicit`;
    document.body.appendChild(recaptcha);
}

// Live SaaS embed tied to Calendly's booking backend, not vendored like the static libs.
const CALENDLY_WIDGET = 'https://assets.calendly.com/assets/external/widget';

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
            script.remove();
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
    });
}

const scriptPromises = new Map();
function loadScriptOnce(src) {
    if (!scriptPromises.has(src)) {
        scriptPromises.set(src, loadScript(src).catch(error => {
            // Don't cache a failed load (offline, dropped connection while
            // the machine slept): drop the memoised promise so a later
            // trigger can retry from scratch.
            scriptPromises.delete(src);
            throw error;
        }));
    }
    return scriptPromises.get(src);
}

function loadDoughnutLabelPlugin() {
    if (window.Chart.registry.plugins.get('doughnutLabel')) {
        return undefined;
    }
    return loadScriptOnce('js/chartjs-plugin-doughnutlabel.min.js');
}

// `type` decides whether the doughnutLabel plugin (only useful for
// doughnut/pie's cutout) is worth fetching alongside Chart.js core.
function loadChartJs(type = 'doughnut') {
    const corePromise = window.Chart ? Promise.resolve() : loadScriptOnce('js/chart.umd.min.js');
    if (type !== 'doughnut' && type !== 'pie') {
        return corePromise;
    }
    return corePromise.then(loadDoughnutLabelPlugin);
}

// doughnutlabel's auto-shrink is broken (reads the wrong innerRadius), so refit the text ourselves.
const CENTER_TEXT_BASE_FONT_SIZE = 16;
function fitCenterTextToHole(chartInstance) {
    const labelOption = chartInstance.options.plugins.doughnutLabel?.labels?.[0];
    const innerRadius = chartInstance.getDatasetMeta(0).controller?.innerRadius;
    if (!labelOption || !innerRadius) {
        return;
    }
    const ctx = chartInstance.ctx;
    ctx.font = `${labelOption.font.weight} ${CENTER_TEXT_BASE_FONT_SIZE}px ${labelOption.font.family}`;
    const textWidth = ctx.measureText(labelOption.text).width;
    const textHeight = CENTER_TEXT_BASE_FONT_SIZE * 1.2;
    const diagonal = Math.hypot(textWidth, textHeight);
    const scale = Math.min(1, (2 * innerRadius) / diagonal);
    labelOption.font.size = Math.max(8, Math.floor(CENTER_TEXT_BASE_FONT_SIZE * scale));
}

function createCircularChart({
    canvasId,
    type = 'doughnut',
    data,
    backgroundColor,
    labels,
    title,
    subtitle,
    centerText,
    cutout = '50%'
}) {
    const canvas = $(`#${canvasId}`)[0];
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        return existingChart;
    }
    const context = canvas.getContext('2d');
    const total = data.reduce((a, b) => a + b, 0);
    // doughnutLabel needs a cutout hole to draw into - only doughnut/pie have one.
    const supportsCenterText = centerText && (type === 'doughnut' || type === 'pie');
    // The site font (--font-family in common.css), so the chart follows it.
    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim();

    chart = new Chart(context, {
        type,
        // Runs before the global doughnutLabel plugin's own beforeDraw, so it reads the corrected size the same frame.
        plugins: supportsCenterText ? [{
            id: 'centerTextFit',
            beforeDraw: (chartInstance) => fitCenterTextToHole(chartInstance)
        }] : [],
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor,
                borderWidth: 0,
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    enabled: false
                },
                ...(supportsCenterText && {
                    doughnutLabel: {
                        labels: [{
                            text: centerText,
                            font: { family: fontFamily, size: 16, weight: 'bold' },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim()
                        }]
                    }
                }),
                title: {
                    display: true,
                    text: title,
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
                    font: {
                        family: fontFamily,
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                subtitle: {
                    display: true,
                    text: subtitle,
                    color: `#${cssVarToHex('--secondary')}`,
                    font: {
                        family: fontFamily,
                        size: 14,
                        weight: 'normal'
                    },
                    padding: {
                        bottom: 15
                    }
                },
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        font: {
                            family: fontFamily,
                            size: 13,
                            weight: '400'
                        },
                        boxWidth: 14,
                        boxHeight: 14,
                        padding: 14,
                        usePointStyle: false,
                        generateLabels(legendChart) {
                            const chartData = legendChart.data;
                            return chartData.labels.map((label, i) => {
                                const value = chartData.datasets[0].data[i];
                                const percentage = ((value / total) * 100).toFixed(0);
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: chartData.datasets[0].backgroundColor[i],
                                    // 0, not omitted: Chart.js would default to a 1px #666 stroke.
                                    lineWidth: 0,
                                    fontColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim()
                                };
                            });
                        }
                    }
                }
            },
            cutout,
            responsive: true,
            animation: {
                animateRotate: true,
                duration: 2000,
                easing: 'easeInOutCubic'
            }
        }
    });

    if (supportsCenterText) {
        fitCenterTextToHole(chart);
    }

    return chart;
}

(function ($) {
    "use strict";

    $(window).stellar({
        responsive: true,
        parallaxBackgrounds: true,
        parallaxElements: true,
        horizontalScrolling: false,
        hideDistantElements: false,
        scrollProperty: 'scroll'
    });

    const fullHeight = function () {
        $('.js-fullheight').css('height', $(window).height());
        $(window).resize(function () {
            $('.js-fullheight').css('height', $(window).height());
        });
    };
    fullHeight();

    $.Scrollax();

    const burgerMenu = function () {
        $('body').on('click', '.navbar-toggler', function (event) {
            event.preventDefault();
            if ($('#ftco-nav').is(':visible')) {
                $(this).removeClass('active');
            } else {
                $(this).addClass('active');
            }
        });
    };
    burgerMenu();

    const onePageClick = function () {
        $(document).on('click', '#ftco-nav a[href^="#"]', function (event) {
            event.preventDefault();
            // The navbar is on every page but its section targets are not, so
            // bail when the href points to an id absent from the current page.
            const target = $($.attr(this, 'href'));
            if (!target.length) {
                return;
            }
            $('html, body').animate({
                scrollTop: target.offset().top - 70
            }, 500);
        });
    };
    onePageClick();

    const carousel = function () {
        initCarousel(`#${appSkills[0]}`);
    };
    carousel();

    $(window).scroll(function () {
        const scrollTop = $(this).scrollTop(),
            navbar = $('#ftco-navbar'),
            wasAwake = navbar.hasClass('awake');
        // Fixed, opaque navbar past 150px
        navbar.toggleClass('scrolled', scrollTop >= 150);
        // Brand switches from light to theme color past 350px
        navbar.toggleClass('awake', scrollTop >= 350);
        // Smooths the awake -> scrolled transition only when scrolling back
        // up out of the awake zone (not when first scrolling down into it)
        navbar.toggleClass('sleep', scrollTop >= 150 && scrollTop < 350 && wasAwake);
    });

    const counter = function () {
        const numbers = document.querySelectorAll('.number');
        if (!numbers.length) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const formatter = new Intl.NumberFormat(getCurrentLanguage());
        const animate = function (el) {
            const target = Number(el.dataset.number) || 0;
            if (reduce) {
                el.textContent = formatter.format(target);
                return;
            }
            const duration = 2000;
            const start = performance.now();
            const step = function (now) {
                const progress = Math.min(Math.max((now - start) / duration, 0), 1);
                const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                el.textContent = formatter.format(Math.round(target * eased));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };
        // rootMargin trims 5% off the viewport bottom so the count starts as the
        // element reaches 95% of the viewport height, matching the old Waypoints
        // `offset: '95%'`.
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -5% 0px' });
        numbers.forEach(function (el) {
            observer.observe(el);
        });
    };
    counter();

    const contentWayPoint = function () {
        const revealQueuedItems = function () {
            $('body .ftco-animate.item-animate').each(function (k) {
                const el = $(this);
                setTimeout(() => {
                    const effect = el.data('animate-effect') || 'fadeInUp';
                    el.addClass(`${effect} ftco-animated`);
                    el.removeClass('item-animate');
                }, k * 50, 'easeInOutExpo');
            });
        };

        $('.ftco-animate').waypoint(function (direction) {
            if (direction === 'down' && !$(this.element).hasClass('ftco-animated')) {
                $(this.element).addClass('item-animate');
                setTimeout(revealQueuedItems, 100);
            }
        }, {
            offset: '95%'
        });
    };
    contentWayPoint();

    // The scroll-down arrow's own href (#projects-section) is its target; preventDefault keeps the animated scroll and leaves the URL hash alone.
    $('.mouse-icon').on('click', function (event) {
        event.preventDefault();
        const target = $(this.hash);
        if (!target.length) {
            return;
        }
        $('html,body').animate({
            scrollTop: target.offset().top
        }, 500, 'easeInOutExpo');
    });

    const TxtRotate = function (el, toRotate, period) {
        this.toRotate = toRotate;
        this.el = el;
        this.loopNum = 0;
        this.period = Number.parseInt(period, 10) || 2000;
        this.txt = '';
        this.tick();
        this.isDeleting = false;
    };
    TxtRotate.prototype.tick = function () {
        const i = this.loopNum % this.toRotate.length;
        const fullTxt = this.toRotate[i];

        this.txt = this.isDeleting ? fullTxt.substring(0, this.txt.length - 1) : fullTxt.substring(0, this.txt.length + 1);
        this.el.html('<span class="wrap"></span>');
        this.el.find('.wrap').text(this.txt);

        let delta = 300 - Math.random() * 100;

        if (this.isDeleting) {
            delta /= 2;
        }

        if (!this.isDeleting && this.txt === fullTxt) {
            delta = this.period;
            this.isDeleting = true;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500;
        }

        setTimeout(() => {
            this.tick();
        }, delta);
    };
    $('.txt-rotate').each(function () {
        const toRotate = $(this).attr('data-rotate');
        const period = $(this).attr('data-period');
        if (toRotate) {
            this.txtRotate = new TxtRotate($(this), JSON.parse(toRotate), period);
        }
    });

    $('[data-bs-toggle="tooltip"]').each(function () {
        this.tooltip = new bootstrap.Tooltip(this);
        // A mouse click focuses the control, and Bootstrap's focus trigger then kept the tooltip open until a click elsewhere: drop that focus so it closes with the pointer; a keyboard press (detail 0) keeps it
        this.addEventListener('click', event => {
            if (event.detail > 0) {
                this.blur();
            }
        });
    });

})(jQuery);

function labelCarouselControls(target) {
    // Owl Carousel marks these role="presentation" by default, which conflicts
    // with the aria-label they need since they're real, focusable controls.
    $(target).find('.owl-prev').removeAttr('role').attr('aria-label', getMessage('carousel-prev'));
    $(target).find('.owl-next').removeAttr('role').attr('aria-label', getMessage('carousel-next'));
    $(target).find('.owl-dot').each(function (index) {
        $(this).attr('aria-label', `${getMessage('carousel-dot')} ${index + 1}`);
    });
}

// The black band shows a spinner instead of empty cards: is-loading on the carousel while the pictures of the cards it shows are still on their way (lazy, they only start once the carousel is shown, or once autoplay slides to them), and for at least minimum ms when given (a tab the visitor clicks shows it even with every picture in the cache); checked again at each picture that loads or fails (a failed picture counts as complete) and once the minimum is over, against the latest end any call set (data loading-until), so two calls at once never end it early
function showCarouselLoading(target, minimum = 0) {
    const missing = () => [...$(target).find('.owl-item.active img')].filter(img => !img.complete);
    const pending = missing();
    if (!pending.length && !minimum) {
        return;
    }
    const until = Math.max(Date.now() + minimum, $(target).data('loading-until') || 0);
    $(target).addClass('is-loading').data('loading-until', until);
    const done = () => {
        if (Date.now() >= $(target).data('loading-until') && !missing().length) {
            $(target).removeClass('is-loading');
        }
    };
    if (minimum) {
        setTimeout(done, minimum);
    }
    for (const img of pending) {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
    }
}

function initCarousel(target) {
    const itemCount = $(target).children().length;
    $(target).owlCarousel({
        // rewind instead of loop: loop clones items at both ends (+100 extra DOM nodes for hard skills alone)
        loop: false,
        rewind: true,
        lazyLoad: true,
        autoplay: true,
        margin: 10,
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        nav: true,
        autoplayHoverPause: false,
        items: 4,
        navText: ['<span class="icon-chevron-circle-left"></span>', '<span class="icon-chevron-circle-right"></span>'],
        responsive: {
            0: {
                items: Math.min(2, itemCount)
            },
            576: {
                items: Math.min(3, itemCount)
            },
            992: {
                items: Math.min(4, itemCount)
            },
            1200: {
                items: Math.min(5, itemCount)
            }
        }
    });
    labelCarouselControls(target);
    $(`.owl-menu[data-target="${target}"]`).addClass("active").siblings('.owl-menu').removeClass('active');
    $(target).addClass('active');
    showCarouselLoading(target);
    // Autoplay or the arrows bring new cards in: the spinner again while their pictures are missing
    $(target).on('translated.owl.carousel', () => showCarouselLoading(target));
}

// Badge/tag text is already localized server-side (separate _en/_fr builds),
// so filters are built straight from the rendered DOM instead of duplicating
// the experience data in JS.
// The number of an ISO standard (ISO 27001 gives 27001), Infinity for any other
const isoNumber = name => Number(/^ISO (\d+)/.exec(name)?.[1] ?? Infinity);

// The ISO standards first, by number, then the others in the order they came (a stable sort keeps two non-ISO ones as they were)
const sortStandards = values => [...values].sort((a, b) => {
    const [x, y] = [isoNumber(a), isoNumber(b)];
    return x === y ? 0 : x - y;
});

function initExperienceFilters() {
    const container = document.getElementById('experiences');
    const wraps = container ? [...container.querySelectorAll('.resume-wrap')] : [];
    if (!wraps.length) {
        return;
    }

    const groups = [
        { key: 'type', selector: '.badge', label: getMessage('filter-contract') },
        { key: 'companyType', selector: '.company-type-badge', label: getMessage('filter-company-type') },
        { key: 'companySize', selector: '.company-size-badge', label: getMessage('filter-company-size') },
        { key: 'sector', selector: '.sector-tag', label: getMessage('filter-sector') },
        { key: 'standard', selector: '.standard-tag', label: getMessage('filter-standard'), order: sortStandards }
    ];
    groups.forEach(g => { g.values = new Set(); });
    // Every contract of the site is a chip, in the order of resume.json, even one no experience has yet (data-contracts of #experiences)
    JSON.parse(container.dataset.contracts || '[]').forEach(contract => groups[0].values.add(contract));

    wraps.forEach(wrap => {
        groups.forEach(g => {
            wrap.querySelectorAll(g.selector).forEach(el => g.values.add(el.textContent.trim()));
        });
    });

    const active = new Set();
    const toolbar = document.createElement('div');
    toolbar.id = 'experience-filters';
    // Collapsed by default so the experiences, not ~25 chips, come first.
    toolbar.hidden = true;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'experience-filters-toggle';
    toggleBtn.setAttribute('aria-controls', toolbar.id);
    toggleBtn.setAttribute('aria-expanded', 'false');
    const toggleLabel = document.createElement('span');
    const toggleCaret = document.createElement('span');
    toggleCaret.className = 'filter-toggle-caret';
    toggleCaret.setAttribute('aria-hidden', 'true');
    toggleBtn.append(toggleLabel, toggleCaret);
    toggleBtn.addEventListener('click', () => {
        toolbar.hidden = !toolbar.hidden;
        toggleBtn.setAttribute('aria-expanded', String(!toolbar.hidden));
    });

    // The count keeps an active filter visible once the panel is closed again.
    function updateToggleLabel() {
        const label = getMessage('filter-toggle');
        toggleLabel.textContent = active.size ? `${label} (${active.size})` : label;
        toggleBtn.classList.toggle('active', active.size > 0);
    }
    updateToggleLabel();

    function applyFilters() {
        updateToggleLabel();
        let visibleCount = 0;
        wraps.forEach(wrap => {
            const texts = new Set([...wrap.querySelectorAll(groups.map(g => g.selector).join(', '))]
                .map(el => el.textContent.trim()));
            const visible = active.size === 0 || [...active].every(f => texts.has(f));
            wrap.classList.toggle('filtered-out', !visible);
            if (visible) {
                visibleCount++;
                // Filtering can bring a card into view below the fold without
                // ever crossing the waypoint.js scroll trigger that normally
                // reveals it, leaving it stuck at opacity: 0.
                if (!wrap.classList.contains('ftco-animated')) {
                    wrap.classList.add('fadeInUp', 'ftco-animated');
                }
            }
        });
        $('#experiences-empty').toggleClass('d-none', visibleCount !== 0);
    }

    groups.forEach(g => {
        if (!g.values.size) {
            return;
        }
        const group = document.createElement('div');
        group.className = 'filter-group';
        const label = document.createElement('span');
        label.className = 'filter-group-label';
        label.textContent = g.label;
        group.appendChild(label);
        (g.order ? g.order(g.values) : g.values).forEach(value => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'filter-chip';
            chip.textContent = value;
            chip.setAttribute('aria-pressed', 'false');
            chip.addEventListener('click', () => {
                const isActive = active.has(value);
                isActive ? active.delete(value) : active.add(value);
                chip.classList.toggle('active', !isActive);
                chip.setAttribute('aria-pressed', String(!isActive));
                applyFilters();
            });
            group.appendChild(chip);
        });
        toolbar.appendChild(group);
    });

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.id = 'experience-filters-reset';
    resetBtn.textContent = getMessage('filter-reset');
    resetBtn.addEventListener('click', () => {
        active.clear();
        toolbar.querySelectorAll('.filter-chip.active').forEach(chip => {
            chip.classList.remove('active');
            chip.setAttribute('aria-pressed', 'false');
        });
        applyFilters();
    });
    toolbar.appendChild(resetBtn);

    const empty = document.createElement('p');
    empty.id = 'experiences-empty';
    empty.className = 'd-none';
    empty.textContent = getMessage('filter-no-results');

    container.querySelector('h2.heading').after(toggleBtn, toolbar, empty);
}

// Calendly and Chart.js need a hex, but --primary / --secondary can be oklch() expressions (dark mode): an element resolves them, a 1px canvas turns them into sRGB bytes.
function cssVarToHex(name) {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.canvas.width = ctx.canvas.height = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function initIndexPage(langPage) {
        if (window.location.protocol === 'https:') {
            fetch('/.netlify/functions/visit')
                .then(response => response.json())
                .then(data => {
                    $('#ftco-visitor').text(data.visits);
                })
                .catch(error => {
                    $('#ftco-visitor').text(error);
                });
        }

        // :not(.mouse-icon) excludes the hero's scroll-down arrow, which also
        // carries .nav-link for its Bootstrap base styling but isn't part of
        // the appAllSections sequence (it has its own click handler).
        $('.nav-link:not(.mouse-icon)').each(function (index, navLink) {
            navLink.href = `#${appAllSections[index]}`;
            const scrollTarget = $($(navLink).attr('href'));
            if (scrollTarget.length) {
                appScrollSections.push(scrollTarget);
            }
            navLink.addEventListener('click', function (event) {
                event.preventDefault();
                if (appAllSections[index] === appHomeSection) {
                    $('html, body').animate({ scrollTop: 0 }, 500);
                }
                // Check if the link is in subsections
                const subSectionTarget = $($(this).attr('href'));
                if ($(this).closest('#navi').length && subSectionTarget.length) {
                    $('html, body').animate({
                        scrollTop: subSectionTarget.offset().top - 180
                    }, 500);
                }
                saveHashToSession(appAllSections[index]);
            });
        });

        if (window.location.hash) {
            saveHashToSession(getSlugFromUrl());
            clearUrlPath();
        }

        $('#calendly-cta').on('click', function (event) {
            event.preventDefault();
            const url = this.dataset.calendlyUrl;
            const primaryColor = cssVarToHex('--primary');
            // Calendly's widget is only fetched on the first click, not on every page load.
            if (!document.querySelector(`link[href="${CALENDLY_WIDGET}.css"]`)) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = `${CALENDLY_WIDGET}.css`;
                document.head.appendChild(css);
            }
            loadScriptOnce(`${CALENDLY_WIDGET}.js`)
                .then(() => Calendly.initPopupWidget({ url, color: primaryColor }))
                .catch(error => {
                    // Without the widget, the booking page itself still works.
                    console.error(error);
                    window.open(url, '_blank', 'noopener');
                });
        });

        $(window).scroll(function () {
            // Retains the value of the scroll top with the reference at the middle of the page
            const scrollMiddle = $(this).scrollTop() + ($(window).height() / 2);
            if ($(this).scrollTop() < 150) {
                $(`.nav-link[href*="${appHomeSection}"]`).addClass('active');
                saveHashToSession(appHomeSection);
            }
            let scrolled_id;
            for (const appScrollSection of appScrollSections) {
                const scrollStartZone = appScrollSection.offset().top;
                const scrollEndZone = scrollStartZone + appScrollSection.outerHeight();
                if (scrollMiddle >= scrollStartZone && scrollMiddle <= scrollEndZone) {
                    scrolled_id = appScrollSection.attr('id') ?? appHomeSection;
                    saveHashToSession(scrolled_id);
                    clearUrlPath();
                }
            }
            if (scrolled_id !== appCheckpointSubSection && appSubSections.has(scrolled_id)) {
                appCheckpointSubSection = scrolled_id;
                $('#navi a').removeClass('current').filter(`a[href="#${appCheckpointSubSection}"]`).addClass('current');
                saveHashToSession(appCheckpointSubSection);
            }
        });

        loadImages('.logo-school', 'png');
        loadImages('.blog-img', 'avif');
        loadImages('.project.img', 'avif');
        loadImages('.article-image', 'avif');

        lastCvUpdate(langPage);

        initExperienceFilters();

        initPipelineLoop();

        initFlipCards();
        initCounterFilters();

        initCounterTilt();

        initCursorSparks();

        initDocPopovers();

        initProjectLinks();

        const skillsChartCanvas = document.getElementById('skills-chart');
        if (skillsChartCanvas) {
            let skillsChartRendered = false;
            const skillsChartObserver = new IntersectionObserver((entries) => {
                if (skillsChartRendered || !entries[0].isIntersecting) {
                    return;
                }
                const rootStyle = getComputedStyle(document.documentElement);
                const cssVar = (name) => rootStyle.getPropertyValue(name).trim();
                loadChartJs('doughnut').then(() => {
                    if (skillsChartRendered) {
                        return;
                    }
                    skillsChartRendered = true;
                    skillsChartObserver.disconnect();
                    createCircularChart({
                        canvasId: 'skills-chart',
                        data: [45, 25, 15, 10, 5],
                        backgroundColor: [cssVar('--blue'), cssVar('--orange'), cssVar('--green'), cssVar('--red'), cssVar('--purple')],
                        labels: JSON.parse(skillsChartCanvas.dataset.labels),
                        title: skillsChartCanvas.dataset.title,
                        subtitle: skillsChartCanvas.dataset.subtitle,
                        centerText: skillsChartCanvas.dataset.center
                    });
                }).catch(() => {
                    // Chart.js couldn't be fetched (offline / transient network).
                    // Leave the observer connected so the chart is retried the
                    // next time the canvas scrolls into view.
                });
            });
            skillsChartObserver.observe(skillsChartCanvas);
        }

        const contactFormEl = document.querySelector('form[name="contactForm"]');
        if (contactFormEl) {
            const contactFormObserver = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting) {
                    return;
                }
                contactFormObserver.disconnect();
                loadContactScripts();
            });
            contactFormObserver.observe(contactFormEl);
        }

        $('form[name="contactForm"]').on('submit', async (event) => {
            event.preventDefault(); // Avoid the native submission, which would leave the page for the thank-you page of Netlify
            const formData = new FormData(event.target);
            try {
                await sendEmail(formData.get('name'), formData.get('subject'), formData.get('message'));
                if (window.location.protocol === 'https:') {
                    // Keeps a copy in Netlify Forms, posted to the home page of the language since / redirects and would lose the POST
                    formData.set('form-name', event.target.getAttribute('name'));
                    const response = await fetch(`/${langPage}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(formData).toString()
                    });
                    if (!response.ok) {
                        throw new Error(`Netlify Forms answered ${response.status}`);
                    }
                }
            } catch (error) {
                console.error(error);
                return false;
            }
        });

        loadBingo();
}

function initBlogPage(langPage) {
        $('.nav-link:not(.mouse-icon)').each(function (index, navLink) {
            navLink.href = `/${langPage}#${appAllSections[index]}`;
            navLink.addEventListener('click', function () {
                saveHashToSession(appAllSections[index]);
            });
        });

        $(`.nav-link[href*="${appBlogSection}"]`).addClass('active');

        // A bare /blog (direct link, bookmark, Lighthouse) shows the presentation article instead of the error; an unknown #slug still errors.
        if (!window.location.hash && !getCurrentArticle()) {
            history.replaceState(null, null, `${window.location.pathname}#presentation`);
        }

        const currentArticle = getCurrentArticle();
        const recentArticle = getRecentArticle();

        if (currentArticle) {
            const $searchForm = $('.search-form');
            const $searchInput = $('input[name="search-input"]');
            const $suggestions = $('#search-suggestions');
            const $resetSpan = $('.icon-times');
            const $searchSpan = $('.icon-search');
            const $searchInfo = $('#search-info');

            // Points the visitor at the search icon: clicking it again (or pressing Enter) jumps to the next occurrence.
            function pulseSearchButton() {
                $searchSpan.addClass('search-help');
                setTimeout(() => {
                    $searchSpan.removeClass('search-help');
                }, 2500);
            }

            $resetSpan.hide();
            $suggestions.hide();

            const searchHandler = debounce(function () {
                if ($searchInput.val().length > 0) {
                    $resetSpan.show();
                } else {
                    $resetSpan.hide();
                }

                const query = $searchInput.val().toLowerCase().trim();
                $suggestions.empty();

                if (!query) {
                    $suggestions.hide();
                    return;
                }

                const matches = appKeywords.filter(item =>
                    item.toLowerCase().includes(query)
                );

                if (matches.length === 0) {
                    $suggestions.hide();
                    return;
                }

                matches.forEach(item => {
                    $('<li>')
                        .text(item)
                        .on('mousedown', function () {
                            $searchInput.val(item);
                            $suggestions.empty().hide();
                            highlightKeywords([item]);
                        })
                        .appendTo($suggestions);
                });

                $suggestions.stop(true, true).fadeIn(150);
            }, 300);

            $searchInput.on('input', searchHandler);

            $searchInput.on('blur', function () {
                $suggestions.fadeOut(150);
            });

            $searchInput.on('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    $searchSpan.trigger('click');
                } else {
                    $('.article-container').html(originalArticleContent);
                    $searchInfo.hide().removeClass('no-result').text('');
                }
            });

            $searchForm.on('submit', function (event) {
                event.preventDefault();
                const query = $searchInput.val().trim();
                if (!query) return;
                $suggestions.empty().hide();
                highlightKeywords([query]);
                $searchInfo.show().removeClass('no-result');
                indexSearchOccurence = -1;
                const countHighLight = $('.article-container mark.highlight').length;
                if (countHighLight > 0) {
                    // Only report the count here: the next click on the search icon goes to the first occurrence (indexSearchOccurence is -1).
                    $searchInfo.text(`${countHighLight} occurrence${countHighLight > 1 ? 's' : ''}`);
                    pulseSearchButton();
                } else {
                    $searchInfo.text(getMessage('search-no-result')).addClass('no-result');
                }
            });

            $resetSpan.on('click', function () {
                indexSearchOccurence = -1;
                $searchInput.val('').focus();
                $suggestions.empty().hide();
                if (originalArticleContent) {
                    $('.article-container').html(originalArticleContent);
                }
                $(this).hide();
                $searchInfo.text('').removeClass('search-no-result');
            });

            $searchSpan.on('click', function () {
                if (!$searchInfo.text().includes('occurrence')) {
                    $searchForm.submit();
                } else {
                    scrollToNextHighlight();
                }
            });

            if (recentArticle) {
                loadImages('.blog-img', 'avif', true);
                const recentArticleUrl = `/${langPage}/blog#${recentArticle.slug}`;
                // Real href for middle-click / new tab; a plain click only changes the hash on this same page, hence the reload.
                $('.blog-img').attr('href', recentArticleUrl).on('click', function (event) {
                    event.preventDefault();
                    window.location.href = recentArticleUrl;
                    setTimeout(() => location.reload(), 150);
                });
                $('#recent-article-heading').text(recentArticle.title);
                $('.meta')
                    .text(convertDate(recentArticle.date, langPage))
                    .prepend($('<i>', { 'class': 'icon-calendar' }), ' ');
            }

            const $tagCloud = $('.tagcloud');
            $tagCloud.empty();
            const tags = currentArticle.tags;
            $.each(tags, function (index, tag) {
                const tagName = typeof tag === 'string' ? tag : Object.keys(tag)[0];
                const tagLink = typeof tag === 'string' ? '#' : tag[tagName];
                const $a = $('<a></a>')
                    .attr('href', tagLink)
                    .addClass('tag-cloud-link')
                    .text(tagName);
                $tagCloud.append($a);
            });
        } else {
            $('.sidebar').remove();
        }

        const articleShape = $('#article-shape');
        const hashLink = window.location.hash ? getSlugFromUrl() : '';
        const errorArticle = getMessage('error-generic');
        // Centered (body.article-error, css/app.css) and red (.error-message) instead of the normal top-left, sidebar-flanked article layout. The fetched article's real height is gone, so the page collapses to a couple lines - without the scroll reset the visitor stays scrolled where they were, with the (now much higher up) footer and blank space below it.
        const showArticleError = () => {
            articleShape.addClass('error-message').text(errorArticle);
            document.body.classList.add('article-error');
            window.scrollTo(0, 0);
        };
        const host = window.location.origin;
        // getHashFromSession() is shared with the nav links' section hash
        // (e.g. "blog-section"), so a stale value from browsing the main nav
        // must not be mistaken for a remembered article slug.
        const sessionHash = getHashFromSession();
        const isSessionArticle = appArticles.some(article => article.slug === sessionHash);
        const currentHash = hashLink || (isSessionArticle ? sessionHash : '');

        if (currentHash) {
            saveHashToSession(currentHash);
            clearUrlPath();

            // The blog page's <head> never loads standalone.css/js, needed by injected articles (career timeline, cards, accordion...).
            if (!document.querySelector('link[href="css/standalone.css"]')) {
                const standaloneCss = document.createElement('link');
                standaloneCss.rel = 'stylesheet';
                standaloneCss.href = 'css/standalone.css';
                document.head.appendChild(standaloneCss);
            }

            const standaloneJsReady = document.querySelector('script[src="js/standalone.js"]')
                ? Promise.resolve()
                : new Promise((resolve, reject) => {
                    const standaloneJs = document.createElement('script');
                    standaloneJs.src = 'js/standalone.js';
                    standaloneJs.onload = resolve;
                    standaloneJs.onerror = () => reject(new Error('Failed to load js/standalone.js'));
                    document.head.appendChild(standaloneJs);
                });

            const urlArticle = `${host}/.netlify/functions/article?filename=${currentHash}_${langPage}.html`;

            // Fetched directly (no hidden trigger <iframe>): article responses
            // carry frame-ancestors 'none', so framing them only logged a CSP
            // violation and a second request for the URL fetch() already loads.
            Promise.all([fetch(urlArticle).then(response => response.text()), standaloneJsReady])
                .then(([html]) => {
                    if (html.includes("It seems you've hit a broken link or the page has moved") || html.toLowerCase().includes('"error"')) {
                        throw new Error("Resource not found"); // Catch directly to show error message when fetch redirects to 404 page
                    }

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Stable ids, not the guessed .header/.footer classes those
                    // elements never actually carry (#ftco-navbar / #ftco-footer)
                    // - the old selectors silently matched nothing, so the fetched
                    // article's own nav and footer (with its copyright) stayed in.
                    const header = doc.querySelector('#ftco-navbar');
                    if (header) header.remove();

                    const footer = doc.querySelector('#ftco-footer');
                    if (footer) footer.remove();

                    // The fetched article is a full standalone page: its own
                    // #ftco-loader ships "shown" (only ever dismissed once, by
                    // the *current* page's copy, right after initial load) and
                    // its #ftco-visitor is a duplicate counter. Left in, the
                    // injected loader sits fixed/fullscreen over the article
                    // forever, hiding the content behind a blank overlay.
                    const injectedLoader = doc.querySelector('#ftco-loader');
                    if (injectedLoader) injectedLoader.remove();

                    const injectedVisitor = doc.querySelector('#ftco-visitor');
                    if (injectedVisitor) injectedVisitor.remove();

                    // Strip elements and attributes that could execute script.
                    // Article HTML is first-party - the function validates the
                    // filename against a strict allowlist - so this is defense in depth.
                    doc.querySelectorAll('script, iframe, object, embed, link, style, meta').forEach(el => el.remove());

                    doc.querySelectorAll('*').forEach(el => {
                        [...el.attributes].forEach(attr => {
                            const name = attr.name.toLowerCase();
                            const value = attr.value.replace(/\s+/g, '').toLowerCase();
                            const isUrlAttr = ['src', 'xlink:href', 'action', 'formaction'].includes(name);
                            const isDangerousUrl = /^(javascript|data|vbscript):/.test(value);
                            if (name.startsWith('on') || name === 'srcdoc' || (isUrlAttr && isDangerousUrl)) {
                                el.removeAttribute(attr.name);
                            }
                        });
                    });

                    // Sanitize anchor hrefs to prevent open redirects
                    const links = doc.querySelectorAll('a[href]');
                    links.forEach(link => {
                        const href = link.getAttribute('href');
                        if (!href.startsWith('https')) {
                            link.setAttribute('href', appRoutes.error404);
                        }
                    });

                    // Insert the already-parsed and sanitized nodes directly, keeping
                    // whatever markup #article-shape already held after them. Avoids
                    // re-serializing to an HTML string and re-parsing it at a .html() sink.
                    const sanitizedNodes = Array.from(doc.body.childNodes);
                    const existingShapeContent = articleShape.contents().detach();
                    articleShape.empty();
                    sanitizedNodes.forEach(node => articleShape[0].appendChild(node));
                    articleShape.append(existingShapeContent);

                    initArticle(false);
                    $('a[article-link]').each(function () {
                        const articleId = $(this).attr('article-link');
                        $(this).attr('href', `/${langPage}/blog#${articleId}`);
                    });
                    originalArticleContent = $('.article-container').html();
                })
                .catch(error => {
                    console.error(error);
                    showArticleError();
                })
                .finally(() => {
                    $('.about-author').removeClass('d-none').addClass('d-flex');
                });
        } else {
            showArticleError();
        }

        if (currentHash === "presentation") {
            const $sidebarBox = $('<div>', {
                class: 'sidebar-box'
            });
            const $imgDiploma = $('<img>', {
                src: 'images/diploma.avif',
                // The alt text is translated in _data/blog.json and passed on by the sidebar.
                alt: $('.sidebar').data('diplomaAlt'),
                class: 'img-fluid',
                css: {
                    display: 'none'
                }
            // Its displayed size, which reserves the space before it loads (the file is twice as large for high-density screens); set with attr because width and height in the props object would become inline styles.
            }).attr({ width: 267, height: 400 });
            $sidebarBox.append($imgDiploma);
            $('.sidebar').append($sidebarBox);
            $imgDiploma.fadeIn(600);
        }
}

function initPage() {
    const idPage = getCurrentRoute();
    const langPage = getCurrentLanguage();

    loadImages('.icon.svg', 'svg');

    initTranslator();

    initMode();

    $('#cv-download').click(function () {
        const $btn = $(this).addClass('loading');
        setTimeout(() => $btn.removeClass('loading'), 2000);
    });

    $('.open-mfp').click(function () {
        const target = $(this).data('target');
        toggleVisibility(target);
        $(this).attr('aria-expanded', !$(target).is('[hidden]'));
    }).keydown(function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).trigger('click');
        }
    });

    $('.mfp-close').click(function () {
        const modalId = $(this).closest('.mfp')[0].id;
        toggleVisibility(`#${modalId}`);
        $(`[aria-controls="${modalId}"]`).attr('aria-expanded', false);
    });

    $('.owl-menu').click(function () {
        const target = $(this).data('target');
        $('.owl-carousel').not(target).each(function () {
            if (!$(this).hasClass('d-none')) {
                $(this).addClass('d-none');
            }
            $(this).removeClass('active');
        });
        if ($(target).hasClass('owl-loaded')) {
            $(`.owl-menu[data-target="${target}"]`).addClass('active').siblings('.owl-menu').removeClass('active');
        } else {
            initCarousel(target);
        }
        // To avoid glitch switching to other carousel
        $(target).removeClass('d-none').trigger('refresh.owl.carousel');
        labelCarouselControls(target);
        // Asked for by the visitor: every picture of the carousel loads now, not only those shown, so the next slides are ready when autoplay brings them
        $(target).find('img').attr('loading', 'eager');
        showCarouselLoading(target, 400);
    });

    if (idPage === 'index') {
        initIndexPage(langPage);
    } else if (idPage === 'blog') {
        initBlogPage(langPage);
    }

    $('a[href="#"]').click(function (event) {
        event.preventDefault();
    });

    $(document).on('keydown', function (event) {
        // Disable Ctrl + F
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            $('input[name="search-input"]').focus().addClass('highlight-flash');
            setTimeout(function () {
                $('input[name="search-input"]').removeClass('highlight-flash');
            }, 1000);
        }
    });
}

/* Contact Form */

function gapiLoaded() {
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        });
    });
}

function gisLoaded() {
    fetch('/.netlify/functions/env')
        .then(response => response.json())
        .then(variables => {
            appGoogleToken = google.accounts.oauth2.initTokenClient({
                client_id: variables.ENV_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/gmail.send',
                callback: (resp) => {
                    if (resp.error !== undefined) {
                        throw resp;
                    }
                }
            });
        })
        // appGoogleToken stays undefined, so a later form submit fails through handleSendFailure.
        .catch(error => console.error(error));
}

async function sendEmail(senderName, subject, message) {
    // Strip CR/LF from header fields to prevent email header injection
    const safeSubject = String(subject).replace(/[\r\n]+/g, ' ');
    const safeSenderName = String(senderName).replace(/[\r\n]+/g, ' ');
    const appName = document.querySelector('meta[property="og:site_name"]').content;
    const recipient = document.querySelector('meta[name="email"]').content;
    const emailString = [
        'From: me',
        `To: ${recipient}`,
        `Subject: ${safeSubject}`,
        '',
        `${message}`,
        '----------------------------------------',
        `Message sent by ${safeSenderName} (${appName})`,
    ].join('\n');
    const successMessage = getMessage('success-generic');
    const errorMessage = getMessage('error-generic');
    const callbackForm = $('#callback-form');
    callbackForm.text('');

    function handleSendFailure(error) {
        if (error) {
            console.error(error);
        }
        // The visitor's mail app, with the message filled in, for a send Google refused (in-app browsers of LinkedIn or Instagram, Android app, no Google account)
        const mailtoLink = $('<a>', {
            href: `mailto:${recipient}?subject=${encodeURIComponent(safeSubject)}&body=${encodeURIComponent(message)}`,
            text: getMessage('contact-mailto')
        });
        callbackForm.text(`${errorMessage} `).append(mailtoLink);
        appGmailToken = null;
    }

    // Base64 encode the email in URL-safe format
    const base64EncodedEmail = removeTrailingEquals(btoa(emailString).replaceAll('+', '-').replaceAll('/', '_'));

    async function sendHelper(apiToken) {
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `${apiToken.token_type} ${apiToken.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: base64EncodedEmail
            })
        });

        if (response.ok) {
            callbackForm.text(successMessage);
            if (window.location.protocol === 'https:') {
                // The live site forgets the session once the message is sent: the next message asks for consent again
                sessionStorage.clear();
            } else {
                // The local site keeps the token for the next messages
                appGmailToken = apiToken;
            }
        } else {
            handleSendFailure();
        }
    }

    async function checkTokenConsent() {
        return new Promise((resolve, reject) => {
            const interval = 3000;
            // Two minutes, long enough to sign in to Google on a phone (password, two-step verification)
            const timeout = 120;
            const maxRetries = timeout / (interval / 1000);
            let attempts = 0;

            const checkInterval = setInterval(async () => {
                const tokenConsent = gapi.client.getToken();
                if (tokenConsent) {
                    clearInterval(checkInterval);
                    // A send that throws (Gmail unreachable) rejects, so handleSendFailure shows the error instead of the promise never settling
                    try {
                        await sendHelper(tokenConsent);
                        resolve(tokenConsent);
                    } catch (error) {
                        reject(error);
                    }
                } else if (++attempts >= maxRetries) {
                    clearInterval(checkInterval);
                    reject(new Error(`Consent not given within ${timeout} seconds`));
                }
            }, interval);
        });
    }

    // A token kept from an earlier message, otherwise a consent to request
    if (appGmailToken) {
        try {
            await sendHelper(appGmailToken);
        } catch (error) {
            handleSendFailure(error);
        }
    } else {
        callbackForm.text('');
        // Request access token and wait for user consent with Google Identity Services
        try {
            appGoogleToken.requestAccessToken({
                prompt: 'consent'
            });
            await checkTokenConsent();
        } catch (error) {
            handleSendFailure(error);
        }
    }
}

function enableSubmitForm() {
    const submitButton = $('form[name="contactForm"] [type="submit"]');
    const recaptchaResponse = grecaptcha.getResponse();
    submitButton.prop('disabled', !(recaptchaResponse.length));
}

function initCaptcha() {
    fetch('/.netlify/functions/env')
        .then(response => response.json())
        .then(variables => {
            grecaptcha.render('captcha-check', {
                'sitekey': variables.SITE_RECAPTCHA_KEY,
                'callback': enableSubmitForm
            });
        })
        .catch(error => {
            console.error(error);
            return false;
        });
}

/* Dark Mode */

// common.js owns the toggle (class + icon + storage) and fires darkmodechange;
// the skills chart just needs its title and center label recoloured to the
// new --text-color and its subtitle to the new --secondary (doughnutLabel bakes its
// color into the options, unlike our previous custom plugin which read
// --text-color fresh on every draw).
document.addEventListener('darkmodechange', function () {
    if (chart) {
        const rootStyle = getComputedStyle(document.documentElement);
        const textColor = rootStyle.getPropertyValue('--text-color').trim();
        chart.options.plugins.title.color = textColor;
        chart.options.plugins.subtitle.color = `#${cssVarToHex('--secondary')}`;
        if (chart.options.plugins.doughnutLabel) {
            chart.options.plugins.doughnutLabel.labels[0].color = textColor;
        }
        chart.update();
    }
});