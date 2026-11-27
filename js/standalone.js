// standalone: false when injected into the blog page (js/app.js), whose own flow already refreshes the language switcher (saveHashToSession) right around this call.
function initArticle(standalone = true) {
    loadImages('.article-image', 'png');
    loadImages('.icon.svg', 'svg');
    initGlossaryFilters();
    if (standalone) {
        initTranslator();
    }
}

// The domain filters of the glossary of the "Du voc de dev" article (_includes/glossary-filters.html): one chip per badge of the accordion that follows, all off, sorted in the page language; several chips can be on at once, and a card stays shown when it carries any of the chosen domains, every card when none is chosen
function initGlossaryFilters() {
    const bar = document.querySelector('.glossary-filters');
    if (!bar) {
        return;
    }
    const cards = [...bar.nextElementSibling.querySelectorAll(':scope > .card')];
    const domainsOf = card => [...card.querySelectorAll('.badge-definition')].map(badge => badge.textContent.trim());
    const domains = [...new Set(cards.flatMap(domainsOf))].sort((a, b) => a.localeCompare(b, document.documentElement.lang));
    const group = bar.querySelector('.filter-group');
    // Built again after the blog search puts the article back (restoreArticleContent of js/app.js): the old chips, without their listeners, go first
    group.querySelectorAll('.filter-chip, .filter-reset').forEach(button => button.remove());
    const count = bar.querySelector('.glossary-count');
    const active = new Set();
    const reset = document.createElement('button');
    const apply = () => {
        let shown = 0;
        cards.forEach(card => {
            const visible = active.size === 0 || domainsOf(card).some(domain => active.has(domain));
            card.classList.toggle('filtered-out', !visible);
            if (visible) {
                shown++;
            }
        });
        count.textContent = bar.dataset.count.replace('{count}', shown).replace('{total}', cards.length);
        reset.hidden = active.size === 0;
    };
    const chips = domains.map(domain => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip';
        chip.textContent = domain;
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', () => {
            const on = !active.has(domain);
            if (on) {
                active.add(domain);
            } else {
                active.delete(domain);
            }
            chip.classList.toggle('active', on);
            chip.setAttribute('aria-pressed', String(on));
            apply();
        });
        return chip;
    });
    reset.type = 'button';
    reset.className = 'filter-reset';
    reset.textContent = bar.dataset.reset;
    reset.addEventListener('click', () => {
        active.clear();
        chips.forEach(chip => {
            chip.classList.remove('active');
            chip.setAttribute('aria-pressed', 'false');
        });
        apply();
    });
    group.append(...chips, reset);
    apply();
}

// Guarded: on the blog page, app.js's own (richer) initPage() already ran (data-init of <body>, runPageInit() of common.js) before standalone.js ever loads.
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
