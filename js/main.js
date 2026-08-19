const appName = 'Portfolio';
const appRoot = '/en';
const appLanguages = new Set(['en', 'fr']);

const xp = 5;
const cdiCount = 4;
const internshipsCount = 3;
const email = 'nicolas.bogalheiro@gmail.com';
const city = 'Paris';
const certifsCount = 5;
const projectsCount = 20;
const experiencesCount = 6;
const countriesCount = 14;
const dateBirth = '1997-11-19';

const appDefaultRoutes = {
    "policy": "/{lng}/policy",
    "terms": "/{lng}/terms",
    "error404": "/404"
};

const appRoutes = {
    "index": "/{lng}",
    "blog": "/{lng}/blog",
    ...appDefaultRoutes
};

const appHomeSection = "home-section";
const appProjectSection = "projects-section";
const appBlogSection = "blog-section";
const appContactSection = "contact-section";
const goHereSection = "resume-section";

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
    goHereSection,
    ...appSubSections,
    ...appSecondarySections
];

const appSkills = [
    "hard-skills",
    "soft-skills",
    "mad-skills"
];

const appMessages = {
    "success-generic": {
        "fr": "L'opération a été un franc succès.",
        "en": "The operation was successfully completed."
    },
    "error-generic": {
        "fr": "Oops ! Une erreur est survenue. Réessayez plus tard.",
        "en": "Oops ! An error has occurred. Try again later."
    },
    "carousel-prev": {
        "fr": "Précédent",
        "en": "Previous"
    },
    "carousel-next": {
        "fr": "Suivant",
        "en": "Next"
    },
    "carousel-dot": {
        "fr": "Aller à la diapositive",
        "en": "Go to slide"
    }
};

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
    'https://www.linkedin.com/pulse/fundamentals-support-structures-david-apollon'
];

const appArticles = [{
        slug: "bien-pasbien",
        title: {
            "fr": "Bien / Pas Bien : bonnes et mauvaises pratiques de code",
            "en": "Good / Not Good: good and bad coding practices"
        },
        date: "2025-07-26",
        tags: [{
            "Clean Code": "#"
        }, {
            "SOLID": "#"
        }, {
            "Design Patterns": "https://refactoring.guru/design-patterns"
        }, {
            "DRY": "#"
        }, {
            "KISS": "#"
        }, {
            "C#": "#"
        }, {
            "Python": "#"
        }, {
            "JavaScript": "#"
        }]
    },
    {
        slug: "du-voc-de-dev",
        title: {
            "fr": "Du voc' de dev",
            "en": "From the dev vocab"
        },
        date: "2025-05-05",
        tags: [{
            "Framework": "#"
        }, {
            "Library": "#"
        }, {
            "Package": "#"
        }, {
            "Module": "#"
        }]
    },
    {
        slug: "mcs",
        title: {
            "fr": "Une application MCS : Kézako ?",
            "en": "What is a MSC application ?"
        },
        date: "2024-12-23",
        tags: [{
            "MCS": "https://gimelec.fr/wp-content/uploads/2025/03/GIMELEC-Cyber-OT-Livre-blanc-MCS-2025-web.pdf"
        }, {
            "CyberSecurity": "https://cyber.gouv.fr/le-cyberdico"
        }, {
            "Vulnerability": "https://www.cvedetails.com/vulnerability-list"
        }, {
            "REST": "#"
        }, {
            "API": "https://aws.amazon.com/fr/what-is/api"
        }, {
            "OAuth2": "https://loan-truong.medium.com/le-protocole-oauth2-0-a845773bec21"
        }]
    },
    {
        slug: "presentation",
        title: {
            "fr": "Mon parcours pro en quelques lignes",
            "en": "My career in few lines"
        },
        date: "2024-01-01",
        tags: [{
            "Software Engineer": "https://blog.lewagon.com/fr/career/metier-software-engineer"
        }, {
            "Full Stack Developer": "https://blog.lewagon.com/fr/career/metiers-tech-developpement-web-developpeur-full-stack"
        }, {
            "Paris": "#"
        }, {
            "Lyon": "#"
        }, {
            "ESILV": "https://www.esilv.fr/ingenieur/classement"
        }, {
            "UQAC": "https://www.uqac.ca/programme/3037-maitrise-en-informatique-professionnel"
        }]
    },
    {
        slug: "sur-quels-criteres-choisir-une-agence-web",
        titlle: {
            "fr": "Sur quels critères choisir une agence web ?",
            "en": "How to choose a web agency ?"
        },
        date: "2019-07-31",
        tags: [{
            "Web Agency": "#"
        }, {
            "Digital Transformation": "#"
        }, {
            "Project Management": "#"
        }, {
            "Business Growth": "#"
        }]
    },
    {
        slug: "5-conseils-pour-un-nom-de-marque-parfait",
        title: {
            "fr": "5 conseils pour un nom de marque parfait",
            "en": "5 tips for the perfect brand name",
        },
        date: "2019-07-03",
        tags: [{
            "Brand Naming": "#"
        }, {
            "Business Growth": "#"
        }, {
            "Trademark": "#"
        }, {
            "Entrepreneurship": "#"
        }]
    }
];

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
    "SQLAlchemy",
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
    "Internet",

];

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

function capitalize(string, locale, allWords = true) {
    if (!allWords) {
        return string.charAt(0).toLocaleUpperCase(locale) + string.slice(1);
    }
    return string.split(' ').map(word => {
        if (word.length === 0) return word;
        const first = word[0].toLocaleUpperCase(locale);
        const remaining = word.slice(1).toLocaleLowerCase(locale);
        return first + remaining;
    }).join(' ');
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

function scrollToNextHighlight() {
    const $marks = $('.article-container mark.highlight');
    if ($marks.length === 0) return;
    indexSearchOccurence++;
    if (indexSearchOccurence >= $marks.length) {
        indexSearchOccurence = 0;
    }
    $marks.removeClass('current-match');
    const $target = $marks.eq(indexSearchOccurence);
    $target.addClass('current-match')[0].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

function convertDate(dateString, lang, target = 'iso') {
    if (target === 'iso') {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    }
    if (target === 'fr') {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    // target === 'readable': Transform 2000-01-01 into 1 Janvier 2000 or January 1, 2020
    const date = new Date(dateString);
    return capitalize(date.toLocaleDateString(lang, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }), lang);
}

function getHashFromSession() {
    return sessionStorage.getItem('currentHash');
}

function saveHashToSession(hash) {
    sessionStorage.setItem('currentHash', hash);
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

function percentageToDegrees(percentage) {
    return percentage / 100 * 360;
}

function computeAge(englishDate) {
    const d = new Date(englishDate);
    const today = new Date();
    return today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

function getCurrentRoute() {
    const path = window.location.pathname;
    return Object.keys(appRoutes).find(key => {
        const pattern = '^' + appRoutes[key].replace('{lng}', '[a-z]{2}') + '/?$';
        return new RegExp(pattern).test(path);
    }) || 'error404';
}

function getCurrentLanguage() {
    return document.documentElement.lang;
}

function toggleVisibility(selector, visibleClass = 'd-flex') {
    const $element = $(selector);
    if ($element.is('[hidden]') || $element.hasClass('d-none')) {
        $element.prop('hidden', false).removeClass('d-none').addClass(visibleClass);
    } else {
        $element.prop('hidden', true).removeClass(visibleClass);
    }
}

function getCurrentOnlyDate(lang, date = Date.now()) {
    return new Date(date).toLocaleDateString(lang);
}

function getCurrentFullDate(lang, date = Date.now()) {
    return new Date(date).toLocaleString(lang);
}

function lastCvUpdate(lang) {
    const lastUpdateDate = $('#last-update-date');
    fetch(`/.netlify/functions/env?lang=${lang}`)
        .then(res => {
            if (!res.ok) throw new Error("GitHub fetch failed");
            return res.json();
        })
        .then(data => {
            lastUpdateDate.text(data.date ? getCurrentFullDate(lang, data.date) : getCurrentFullDate(lang));
        })
        .catch(error => {
            console.error(error);
            lastUpdateDate.text(getCurrentFullDate(lang));
            return false;
        });
}

function addRedirectById(elementId) {
    const balise = $(`#${elementId}`);
    if (balise) {
        const path = appRoutes[elementId];
        balise.attr('href', path ? path.replace('{lng}', getCurrentLanguage()) : appRoot);
        balise.on('click', function () {
            sessionStorage.clear(); // Reset hash for all other links
        });
    }
}

function loadImages(selector, extension, one = false) {
    const imgs = document.querySelectorAll(`${selector}`);
    Array.from(imgs).some((el, index) => {
        const locationImg = `images/${el.id}.${extension}`;
        if (el.tagName.toLowerCase() === 'img') {
            el.src = locationImg;
        } else {
            el.style.backgroundImage = `url(${locationImg})`;
        }
        // If first iteration, return true to stop further iteration
        return index === 0 && one;
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
            $('#bingo-btn').text('Stop');
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

function getMessage(key) {
    return appMessages[key]?.[`${getCurrentLanguage()}`] || '';
}

function switchLanguage(url, langA = 'en', langB = 'fr') {
    try {
        const urlObj = new URL(url, window.location.origin);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0 && appLanguages.has(pathParts[0])) {
            pathParts[0] = pathParts[0] === langA ? langB : langA;
            urlObj.pathname = `/${pathParts.join('/')}`;
            const hash = getHashFromSession();
            urlObj.hash = (hash && /^[\w-]+$/.test(hash)) ? `#${hash}` : '';
            return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        }
        throw new Error("Language not recognized in URL");
    } catch (error) {
        console.error(error);
        return appDefaultRoutes['error404'];
    }
}

function initTranslator() {
    const toggle = $('#language-toggle');
    if (toggle) {
        toggle.prop('checked', getCurrentLanguage() == 'fr');
        toggle.on('change', function () {
            toggle.checked = getCurrentLanguage() == 'fr';
            const newUrl = switchLanguage(window.location.href);
            if (/^\/(?!\/)/.test(newUrl)) {
                window.location.href = newUrl;
            }
        });
    }
}

function initProfile() {
    $('.author').text($('meta[name="author"]').attr('content'));
    $('#city').text(city);
    $('.email').text(email);
    $('.age').text(computeAge(dateBirth));
    $('.xp').each(function () {
        if ($(this).hasClass('number')) {
            $(this).attr('data-number', xp);
        } else {
            $(this).text(xp);
        }
    });
    $('#cdiCount').text(cdiCount);
    $('#internshipsCount').text(internshipsCount);
    $('#experiences .resume-wrap a:first').addClass('victory');
    $('#certifsCount').attr('data-number', certifsCount);
    $('#projectsCount').attr('data-number', projectsCount);
    $('#experiencesCount').attr('data-number', experiencesCount);
    $('#countriesCount').attr('data-number', countriesCount);
}

function createCircularChart({
    canvasId,
    data,
    backgroundColor,
    labels,
    titles,
    subtitles,
    cutout = '50%'
}) {
    const canvas = $(`#${canvasId}`)[0];
    const context = canvas.getContext('2d');
    const total = data.reduce((a, b) => a + b, 0);
    const currentLanguage = getCurrentLanguage();
    
    chart = new Chart(context, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => {
                if (typeof label === 'string') return label;
                return label[currentLanguage] || label.fr || label.en;
            }),
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 0,
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    enabled: false
                },
                title: {
                    display: true,
                    text: titles[currentLanguage] || titles.fr || titles.en,
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
                    text: subtitles[currentLanguage] || subtitles.fr || subtitles.en,
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
                        boxWidth: 16,
                        boxHeight: 16,
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
                                    strokeStyle: '#ffffff',
                                    lineWidth: 2,
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

    const loader = function () {
        if ($('#ftco-loader').length > 0) {
            $('#ftco-loader').removeClass('show');
        }
    };
    loader();

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
            $('html, body').animate({
                scrollTop: $($.attr(this, 'href')).offset().top - 70
            }, 500);
        });
    };
    onePageClick();

    const carousel = function () {
        initCarousel(`#${appSkills[0]}`);
    };
    carousel();

    $('nav .dropdown').hover(function (event) {
        const isOpen = event.type === 'mouseenter';
        $(this).toggleClass('show', isOpen);
        $(this).find('> a').attr('aria-expanded', isOpen);
        $(this).find('.dropdown-menu').toggleClass('show', isOpen);
    });

    $(window).scroll(function () {
        const scrollTop = $(this).scrollTop(),
            navbar = $('.ftco_navbar'),
            wasAwake = navbar.hasClass('awake');
        // Fixed, opaque navbar past 150px
        navbar.toggleClass('scrolled', scrollTop >= 150);
        // Brand/lang text switches from light to theme color past 350px
        navbar.toggleClass('awake', scrollTop >= 350);
        // Smooths the awake -> scrolled transition only when scrolling back
        // up out of the awake zone (not when first scrolling down into it)
        navbar.toggleClass('sleep', scrollTop >= 150 && scrollTop < 350 && wasAwake);
        // For small screens, the header becomes dark
        $('.off').first().toggleClass('top-scroll', window.scrollY < 150);
    });

    const counter = function () {
        $('.ftco-about, .ftco-counter').waypoint(function (direction) {
            if (direction === 'down' && !$(this.element).hasClass('ftco-animated')) {
                const comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',');
                $('.number').each(function () {
                    $(this).animateNumber({
                        number: $(this).data('number'),
                        numberStep: comma_separator_number_step
                    }, 7000);
                });
            }
        }, {
            offset: '95%'
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

    $('.image-popup').magnificPopup({
        type: 'image',
        closeOnContentClick: true,
        closeBtnInside: false,
        fixedContentPos: true,
        mainClass: 'mfp-no-margins mfp-with-zoom', // Class to remove default margin from left and right side
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 before current and 1 after the current image
        },
        image: {
            verticalFit: true
        },
        zoom: {
            enabled: true,
            duration: 300 // Don't forget to change the duration also in CSS
        }
    });

    $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
        disableOn: 700,
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false
    });

    const goHere = function () {
        $('.mouse-icon').on('click', function (event) {
            event.preventDefault();
            $('html,body').animate({
                scrollTop: $(`#${goHereSection}`).offset().top
            }, 500, 'easeInOutExpo');
        });
    };
    goHere();

    const copyright = function () {
        const yearCopyright = $('#year');
        if (yearCopyright) {
            yearCopyright.text(new Date().getFullYear());
        }
    };
    copyright();

    $('.progress').each(function () {
        const value = $(this).attr('data-value');
        const left = $(this).find('.progress-left .progress-bar');
        const right = $(this).find('.progress-right .progress-bar');

        if (value > 0) {
            if (value <= 50) {
                right.css('transform', 'rotate(' + percentageToDegrees(value) + 'deg)');
            } else {
                right.css('transform', 'rotate(180deg)');
                left.css('transform', 'rotate(' + percentageToDegrees(value - 50) + 'deg)');
            }
        }
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

    AOS.init({
        duration: 800,
        easing: 'linear'
    });

    initProfile();

})(jQuery);

function initCareerAnimation() {
    const container = document.querySelector('.animation-container');
    const car = document.getElementById('car');
    if (!container || !car) {
        return;
    }
    const updateCarPosition = () => {
        const rect = container.getBoundingClientRect();
        const progress = Math.min(Math.max((window.innerHeight / 2 - rect.top) / rect.height, 0), 1);
        car.style.top = `${progress * 100}%`;
    };
    window.addEventListener('scroll', updateCarPosition, { passive: true });
    window.addEventListener('resize', updateCarPosition);
    updateCarPosition();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .catch(error => console.error(error));
    }
}

function initArticle() {
    registerServiceWorker();
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    initCareerAnimation();
}

function labelCarouselControls(target) {
    $(target).find('.owl-prev').attr('aria-label', getMessage('carousel-prev'));
    $(target).find('.owl-next').attr('aria-label', getMessage('carousel-next'));
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

        $('.nav-link').each(function (index, navLink) {
            navLink.href = `#${appAllSections[index]}`;
            appScrollSections.push($($(navLink).attr('href')));
            navLink.addEventListener('click', function (event) {
                event.preventDefault();
                // Check if the link is in subsections
                if ($(this).closest('#navi').length) {
                    $('html, body').animate({
                        scrollTop: $($(this).attr('href')).offset().top - 180
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

        $('.services-1').each(function (index, navLink) {
            navLink.href = buildSafeRedirection(appServices[index], langPage);
        });

        $(window).scroll(function () {
            // Retains the value of the scroll top with the reference at the middle of the page
            const scrollMiddle = $(this).scrollTop() + ($(window).height() / 2);
            if ($(this).scrollTop() < 150) {
                $(`a[href*="${appHomeSection}"]`).addClass('active');
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

        createCircularChart({
            canvasId: 'skillsChart',
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#3e64ff', '#ffa60e', '#8bc34a', '#dc143c', '#9b4f97'],
            labels: ['Back-end', 'Front-end', {
                fr: 'Gestion de projet',
                en: 'Project management'
            }, 'Support', 'CI/CD'],
            titles: {
                fr: 'Répartition du temps passé sur mes compétences',
                en: 'Time distribution across my skills'
            },
            subtitles: {
                fr: `Données basées sur ${xp} années en activité`,
                en: `Data based on ${xp} years in activity`
            }
        });

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
        $('.nav-link').each(function (index, navLink) {
            navLink.href = `/${langPage}#${appAllSections[index]}`;
            navLink.addEventListener('click', function () {
                saveHashToSession(appAllSections[index]);
            });
        });

        $(`a[href*="${appBlogSection}"]`).addClass('active');

        const currentArticle = getCurrentArticle();
        const recentArticle = getRecentArticle();

        if (currentArticle) {
            const $searchForm = $('.search-form');
            const $searchInput = $('input[name="search-input"]');
            const $suggestions = $('#search-suggestions');
            const $resetSpan = $('.icon-times');
            const $searchSpan = $('.icon-search');
            const $searchInfo = $('#search-info');

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
                    scrollToNextHighlight();
                    if ($searchInput.val() !== '' && !$searchInfo.hasClass('no-result')) {
                        $searchSpan.addClass('search-help');
                        setTimeout(() => {
                            $searchSpan.removeClass('search-help');
                        }, 2500);
                    }
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
                    const firstMark = $('.article-container mark.highlight').first();
                    $searchInfo.text(`${countHighLight} occurrence${countHighLight > 1 ? 's' : ''}`);
                    indexSearchOccurence = 0;
                    firstMark.addClass('current-match')[0].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                } else {
                    $searchInfo.text('Houston, we have a problem').addClass('no-result');
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
                $('.heading').text(recentArticle.title[langPage]);
                $('.meta').html('<i class="icon-calendar"></i> ' + convertDate(recentArticle.date, langPage, 'readable'));
            }

            const $tagCloud = $('.tagcloud');
            $tagCloud.empty();
            const tags = currentArticle.tags;
            $.each(tags, function (index, tag) {
                const tagName = tag && Object.keys(tag)[0];
                const tagLink = tag[tagName];
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
        const iframeArticle = $('#iframe-article');
        const hashLink = window.location.hash ? getSlugFromUrl() : '';
        const errorArticle = getMessage('error-generic');
        const host = window.location.origin;
        const currentHash = hashLink || getHashFromSession();

        if (currentHash) {
            saveHashToSession(currentHash);
            clearUrlPath();
            const urlArticle = `${host}/.netlify/functions/article?filename=${currentHash}_${langPage}.html`;

            iframeArticle.prop('src', urlArticle);

            iframeArticle.on('load', function () {
                fetch(urlArticle)
                    .then(response => response.text())
                    .then(html => {
                        if (html.includes("It seems you've hit a broken link or the page has moved") || html.toLowerCase().includes('"error"')) {
                            throw new Error("Resource not found"); // Catch directly to show error message when fetch redirects to 404 page
                        }

                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        const header = doc.querySelector('.header');
                        if (header) header.remove();

                        const footer = doc.querySelector('.footer');
                        if (footer) footer.remove();

                        // Remove potential XSS vectors
                        const dangerousTags = doc.querySelectorAll('script, iframe, object, embed, link, style, meta');
                        dangerousTags.forEach(el => el.remove());

                        // Sanitize anchor hrefs to prevent open redirects
                        const links = doc.querySelectorAll('a[href]');
                        links.forEach(link => {
                            const href = link.getAttribute('href');
                            if (!href.startsWith('https')) {
                                link.setAttribute('href', appDefaultRoutes['error404']);
                            }
                        });

                        articleShape.html(doc.body.innerHTML + articleShape.html());

                        initArticle();
                        initProfile();
                        $('a[article-link]').each(function () {
                            const articleId = $(this).attr('article-link');
                            $(this).attr('href', `/${langPage}/blog#${articleId}`);
                        });
                        originalArticleContent = $('.article-container').html();
                    })
                    .catch(error => {
                        console.error(error);
                        articleShape.text(errorArticle);
                    })
                    .finally(() => {
                        $('#iframe-article').remove();
                        $('.about-author').removeClass('d-none').addClass('d-flex');
                    });
            });
        } else {
            articleShape.text(errorArticle);
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
    registerServiceWorker();

    applyDarkModePreference();

    const idPage = getCurrentRoute();
    const langPage = getCurrentLanguage();

    loadImages('.icon.svg', 'svg');

    $.each(appRoutes, function (appRoute) {
        addRedirectById(appRoute);
    });

    initTranslator();

    $('.open-mfp').click(function () {
        const target = $(this).data('target');
        toggleVisibility(target);
    });

    $('.mfp-close').click(function () {
        const modalId = $(this).closest('.mfp')[0].id;
        toggleVisibility(`#${modalId}`);
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

    const versionElement = $('#version-badge');
    fetch('/package.json')
        .then(response => response.json())
        .then(data => {
            if (versionElement && data.version) {
                versionElement.text(data.version);
            }
        })
        .catch(error => {
            console.error(error);
            versionElement.text(1.0);
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
    const emailString = [
        'From: me',
        'To: nicolas.bogalheiro@gmail.com',
        `Subject: ${subject}`,
        '',
        `${message}`,
        '----------------------------------------',
        `Message sent by ${senderName} (${appName})`,
    ].join('\n');
    const successMessage = getMessage('success-generic');
    const errorMessage = getMessage('error-generic');
    const callbackForm = $('#callback-form');
    callbackForm.text('');

    // Base64 encode the email in URL-safe format
    const base64EncodedEmail = removeTrailingEquals(btoa(emailString).replaceAll('+', '-').replaceAll('/', '_'));

    // Check if token exists, otherwise request it
    const token = JSON.parse(localStorage.getItem('tokenAPI'));

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
            localStorage.setItem('tokenAPI', JSON.stringify(token));
            callbackForm.text(successMessage);
            if (window.location.protocol === 'https:') {
                sessionStorage.clear();
            }
        } else {
            callbackForm.text(errorMessage);
            localStorage.clear();
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
            console.error(error);
            callbackForm.text(errorMessage);
            localStorage.clear();
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
            console.error(error);
            callbackForm.text(errorMessage);
            localStorage.clear();
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

function applyDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    $('html').toggleClass('dark-mode', isDark);
    $('#dark-icon').attr('class', isDark ? 'icon-moon-o' : 'icon-sun-o');
}

function toggleDarkMode(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    $('html').toggleClass('dark-mode');
    const $icon = $('#dark-icon');
    const isDark = $('html').hasClass('dark-mode');
    $icon.attr('class', isDark ? 'icon-moon-o' : 'icon-sun-o');
    localStorage.setItem('darkMode', isDark);
    if (chart) {
        chart.options.plugins.title.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        chart.update();
    }
}