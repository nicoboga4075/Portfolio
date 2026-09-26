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

const appProjects = [
    'https://www.esilv.fr/challenges-citoyens-cgi-2019-deux-premiers-prix-esilv-categories-environnement-et-handicap',
    'blog#mcs',
    'crm_elphicom',
    'ebatisoft',
    'jca_sushirobots',
    'pragma_surveys',
    'ref230_afnor',
    'panel_mnt',
    'opale_snitem'
];

const appServices = [
    'https://www.soft-concept.com/sondages-presidentielle/WebReports.dll',
    'https://www.salesforce.com/fr/resources/definition/gestion-relation-client',
    'https://github.com/nicoboga4075',
    'https://www.lumapps.com/fr/digital-workplace/outils-transformation-digitale',
    appProjectSection,
    'https://www.linkedin.com/pulse/fundamentals-support-structures-david-apollon',
    'https://www.ibm.com/fr-fr/topics/ai-automation',
    'https://cyber.gouv.fr/',
    appBlogSection
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
    // Main Cities
    "Paris",
    "Lyon",
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

let appGoogleToken;
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

function computeAge(englishDate) {
    const d = new Date(englishDate);
    const today = new Date();
    return today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
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
            $('#bingo-timer').removeClass();
            $('#bingo-btn').text($('#bingo-btn').data('stop'));
            timer = setInterval(() => {
                number++;
                $('#bingo-timer').text(number);
            }, 10);
        } else if (number == target) {
            $('#bingo-timer').addClass('victory');
        } else {
            $('#bingo-timer').addClass('defeat');
            $('#bingo-btn').text(labelBtn);
            clearInterval(timer);
            number = 0;
        }
    });
}

function initProfile() {
    $('.author').text($('meta[name="author"]').attr('content'));
    $('#address').text(address);
    $('.email').text(email);
    $('.age').text(computeAge(dateBirth));
    $('.xp').each(function () {
        if ($(this).hasClass('number')) {
            $(this).attr('data-number', xp);
        } else {
            $(this).text(xp);
        }
    });
    fillCareerCounts();
    $('#experiences .resume-wrap .date:contains("Today"), #experiences .resume-wrap .date:contains("Aujourd\'hui")')
        .closest('.resume-wrap').find('a:first').addClass('victory');
    $('#certifsCount').attr('data-number', certifsCount);
    $('#projectsCount').attr('data-number', projectsCount);
    $('#experiencesCount').attr('data-number', experiencesCount);
    $('#countriesCount').attr('data-number', countriesCount);
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

// `type` decides whether the doughnutLabel plugin (only useful for
// doughnut/pie's cutout) is worth fetching alongside Chart.js core.
function loadChartJs(type = 'doughnut') {
    if (!loadChartJs.corePromise) {
        loadChartJs.corePromise = window.Chart ? Promise.resolve() : loadScript('js/chart.umd.min.js').catch(error => {
            // Don't cache a failed load (offline, dropped connection while
            // the machine slept): drop the memoised promise so a later
            // trigger can retry from scratch.
            loadChartJs.corePromise = null;
            throw error;
        });
    }
    if (type !== 'doughnut' && type !== 'pie') {
        return loadChartJs.corePromise;
    }
    return loadChartJs.corePromise.then(() => {
        if (window.Chart.registry.plugins.get('doughnutLabel')) {
            return;
        }
        if (!loadChartJs.pluginPromise) {
            loadChartJs.pluginPromise = loadScript('js/chartjs-plugin-doughnutlabel.min.js').catch(error => {
                loadChartJs.pluginPromise = null;
                throw error;
            });
        }
        return loadChartJs.pluginPromise;
    });
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
    titles,
    subtitles,
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
                            font: { family: 'Poppins', size: 16, weight: 'bold' },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim()
                        }]
                    }
                }),
                title: {
                    display: true,
                    text: titles,
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim(),
                    font: {
                        family: 'Poppins',
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        family: 'Poppins',
                        top: 10,
                        bottom: 20
                    }
                },
                subtitle: {
                    display: true,
                    text: subtitles,
                    color: getComputedStyle(document.documentElement).getPropertyValue('--gray').trim(),
                    font: {
                        family: 'Poppins',
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
                            family: 'Poppins',
                            size: 13,
                            weight: '400'
                        },
                        boxWidth: 14,
                        boxHeight: 14,
                        padding: 14,
                        usePointStyle: false,
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => {
                                const value = chart.data.datasets[0].data[i];
                                const percentage = ((value / total) * 100).toFixed(0);
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    // 0, not omitted: Chart.js would default to a 1px #666 stroke.
                                    lineWidth: 0,
                                    fontColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim()
                                };
                            });
                        }
                    }
                }
            },
            cutout: cutout,
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

    // The scroll-down arrow's own href (#resume-section) is its target; preventDefault keeps the animated scroll and leaves the URL hash alone.
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
    });

    initProfile();

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

function initCarousel(target) {
    const itemCount = $(target).children().length;
    $(target).owlCarousel({
        loop: true,
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
}

function buildSafeRedirection(redirect, langPage) {
    let safeRedirection = '';
    if (redirect.startsWith('https://')) {
        safeRedirection = redirect;
    } else if (redirect.startsWith('http://')) {
        safeRedirection = appDefaultRoutes["error404"];
    } else if (appAllSections.includes(redirect)) {
        safeRedirection = `/${langPage}#${redirect}`;
    } else {
        safeRedirection = `/${langPage}/${redirect}`;
    }
    return safeRedirection;
}

// Badge/tag text is already localized server-side (separate _en/_fr builds),
// so filters are built straight from the rendered DOM instead of duplicating
// the experience data in JS.
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
        { key: 'sector', selector: '.sector-tag', label: getMessage('filter-sector') }
    ];
    groups.forEach(g => g.values = new Set());

    wraps.forEach(wrap => {
        groups.forEach(g => {
            wrap.querySelectorAll(g.selector).forEach(el => g.values.add(el.textContent.trim()));
        });
    });

    const active = new Set();
    const toolbar = document.createElement('div');
    toolbar.id = 'experience-filters';

    function applyFilters() {
        let visibleCount = 0;
        wraps.forEach(wrap => {
            const texts = new Set([...wrap.querySelectorAll('.badge, .company-type-badge, .company-size-badge, .sector-tag')]
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
        g.values.forEach(value => {
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

    container.querySelector('h2.heading').after(toolbar, empty);
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

        $('.project .explore').each(function (index, navLink) {
            navLink.href = buildSafeRedirection(appProjects[index], langPage);
        });

        $('.blog-entry .article-image').each(function (index, navLink) {
            navLink.href = `/${langPage}/blog#${appArticles[index].slug}`;
        });

        $('.services').each(function (index, navLink) {
            navLink.href = buildSafeRedirection(appServices[index], langPage);
        });

        $('#calendly-cta').on('click', function (event) {
            event.preventDefault();
            const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main').trim().replace('#', '');
            Calendly.initPopupWidget({ url: this.dataset.calendlyUrl, color: mainColor });
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

        const skillsChartCanvas = document.getElementById('skillsChart');
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
                        canvasId: 'skillsChart',
                        data: [45, 25, 15, 10, 5],
                        backgroundColor: [cssVar('--blue'), cssVar('--orange'), cssVar('--green'), cssVar('--red'), cssVar('--purple')],
                        labels: JSON.parse(skillsChartCanvas.dataset.labels),
                        titles: skillsChartCanvas.dataset.title,
                        subtitles: skillsChartCanvas.dataset.subtitleTemplate.replace('{xp}', xp),
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
            event.preventDefault(); // Avoid Netlify default submission
            const formData = new FormData(event.target);
            try {
                await sendEmail(formData.get('name'), formData.get('subject'), formData.get('message'));
                if (window.location.protocol === 'https:') {
                    $(this).submit(); // Submit form after sending the email
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
                if (originalArticleContent != undefined) {
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
                $('.blog-img').on('click', function () {
                    window.location.href = `/${langPage}/blog#${recentArticle.slug}`;
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
                            link.setAttribute('href', appDefaultRoutes['error404']);
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
                    initProfile();
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
                src: 'images/diploma.png',
                class: 'img-fluid',
                css: {
                    height: '400px',
                    display: 'none'
                }
            });
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
        .then(variables => appGoogleToken = google.accounts.oauth2.initTokenClient({
            client_id: variables.ENV_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/gmail.send',
            callback: (resp) => {
                if (resp.error !== undefined) {
                    throw resp;
                }
            }
        }));
}

async function sendEmail(senderName, subject, message) {
    // Strip CR/LF from header fields to prevent email header injection
    const safeSubject = String(subject).replace(/[\r\n]+/g, ' ');
    const safeSenderName = String(senderName).replace(/[\r\n]+/g, ' ');
    const emailString = [
        'From: me',
        'To: nicolas.bogalheiro@gmail.com',
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
        callbackForm.text(errorMessage);
        sessionStorage.removeItem('tokenAPI');
    }

    // Base64 encode the email in URL-safe format
    const base64EncodedEmail = removeTrailingEquals(btoa(emailString).replaceAll('+', '-').replaceAll('/', '_'));

    // Check if token exists, otherwise request it
    const token = JSON.parse(sessionStorage.getItem('tokenAPI'));

    async function sendHelper(token) {
        const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `${token.token_type} ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: base64EncodedEmail
            })
        });

        if (response.ok) {
            sessionStorage.setItem('tokenAPI', JSON.stringify(token));
            callbackForm.text(successMessage);
            if (window.location.protocol === 'https:') {
                sessionStorage.clear();
            }
        } else {
            handleSendFailure();
        }
    }

    async function checkTokenConsent() {
        return new Promise((resolve, reject) => {
            const interval = 3000;
            const maxRetries = 30 / (interval / 1000);
            let attempts = 0;

            const checkInterval = setInterval(async () => {
                const tokenConsent = gapi.client.getToken();
                if (tokenConsent) {
                    clearInterval(checkInterval);
                    await sendHelper(tokenConsent);
                    resolve(tokenConsent);
                } else if (++attempts >= maxRetries) {
                    clearInterval(checkInterval);
                    reject(new Error("Consent not given within 30 seconds"));
                }
            }, interval);
        });
    }

    if (token) {
        try {
            await sendHelper(token);
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
    const submitButton = $('input[type="submit"]');
    const recaptchaResponse = grecaptcha.getResponse();
    submitButton.prop('disabled', !(recaptchaResponse.length));
}

function initCaptcha() {
    fetch('/.netlify/functions/env')
        .then(response => response.json())
        .then(variables => {
            grecaptcha.render('captchaCheck', {
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
// new --text-color and its subtitle to the new --gray (doughnutLabel bakes its
// color into the options, unlike our previous custom plugin which read
// --text-color fresh on every draw).
document.addEventListener('darkmodechange', function () {
    if (chart) {
        const rootStyle = getComputedStyle(document.documentElement);
        const textColor = rootStyle.getPropertyValue('--text-color').trim();
        chart.options.plugins.title.color = textColor;
        chart.options.plugins.subtitle.color = rootStyle.getPropertyValue('--gray').trim();
        if (chart.options.plugins.doughnutLabel) {
            chart.options.plugins.doughnutLabel.labels[0].color = textColor;
        }
        chart.update();
    }
});