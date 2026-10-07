---
name: wcag-contrast
description: Checks WCAG AA contrast on every page of the portfolio (EN and FR, home, blog, every article and project, policy, terms), in light and dark mode, at phone, tablet, laptop and desktop sizes - text on load, on hover, after interactions (opened cards, menus, windows, panels, carousel slides, search suggestions, tooltips) and under keyboard focus, plus non-text contrast (focus indicators, icon-only controls, field borders) - then fixes what fails. Use it whenever a change touches a colour, before calling the change done or committing it - a colour variable in css/common.css (--primary, --secondary, --accent-color, --background-color, --text-color, the palette or the -light / -dark / -pale shades), any color, background, background-color, border-color, outline, box-shadow, opacity, filter, mix-blend-mode or text-shadow declaration, an overlay or a background image, a hover, focus or dark-mode rule, a font size or weight (they move the threshold), a new interactive component, or a colour set from JS (js/botpress.js, the skills chart). Also use it when asked to audit, check or fix contrast or colour accessibility.
---

# WCAG contrast check

The site must meet **WCAG 2.2 AA** contrast on every device and in both themes:

- text: **4.5:1**, or **3:1** for large text (24px and more, or 18.66px and more in bold, 700+), in every state a visitor can reach;
- non-text: **3:1** for focus indicators, the icon of an icon-only control and a field's boundary (its border or its fill) against what surrounds them.

A colour change is not done until the check below passes.

## Run it

```
npm run contrast
```

That is `node .claude/skills/wcag-contrast/check-contrast.mjs`. It:

1. builds the preview into `.eleventy/` (`ELEVENTY_PREVIEW=1`, the source pages are never touched);
2. serves it with the `_redirects` rewrites and the article function, so pages are checked the way Netlify serves them: articles inside the blog (`/en/blog#<slug>`), projects at `/en/<slug>`;
3. opens every page at 390px (phone), 768px (tablet), 1280px (laptop) and 1920px (desktop), in light and dark mode, with scroll reveals shown, lazy images loaded and CSS and jQuery animations off;
4. checks, with axe-core's `color-contrast` rule plus a pixel measure behind the glyphs for what axe can't decide (text over a photo, a gradient, an overlay):
   - **on load**: the whole page;
   - **on hover**: every element the site's stylesheets restyle on `:hover`, read from the CSS itself, so a new hover style is covered without editing the script;
   - **after interactions** (`INTERACTIONS` in the script): every vocabulary card opened, the mobile menu, the contact window, the filter panel and an active filter, the blog search suggestions, every slide of every carousel, the tooltips;
5. at phone and desktop sizes (focus and non-text don't depend on the width, only on the theme), also checks:
   - **keyboard focus**: one element of each kind (tag, classes, parent), its text while focused, and that focusing it shows an indicator with enough pixels at 3:1 against what they cover (about a 1px ring all around); "no visible change on focus" means it has none;
   - **non-text contrast**: the icon of every link or button without text, and every text field's border or fill against its surroundings.

It exits with code 1 and lists each distinct problem (kind, ratio, needed ratio, colours, element, where it shows up) when anything fails, 0 when everything passes. A full run takes about half an hour.

Options, for iterating faster before the final full run:

- `--no-build`: reuse the current `.eleventy/` output;
- `--quick`: phone and desktop only;
- `--only=blog`: only the pages whose URL contains the text. Write it without a leading slash (`--only=en/blog`), because Git Bash rewrites `/en/...` into a Windows path;
- `--sizes=phone,tablet` (phone, tablet, laptop, desktop) and `--modes=dark` (light, dark): only those sizes or themes;
- `--pages=/fr/blog,/en/blog#presentation`: only those exact URLs, to recheck what a full run reported without redoing the rest;
- `--json=<file>`: also save every finding;
- `--shots=<dir>`: save the before / after shots of each focus indicator failure, to see what the check saw.

`npm run contrast -- --quick --only=blog` passes options through npm.

## Fix what fails

Fix the cause, then run the check again until it prints **PASS**. Fix in this order of preference:

1. **Use an existing shade instead of a new colour.** The site's shades are in `:root` in `css/common.css`:
   - `--primary-dark` (`#2f55f5`) under white text: every filled background that carries text or an icon (buttons, badges, the active language, active chips, the contact header and icons, the chat button, footer links, project overlays) uses it, so it reaches 5.62:1 in both themes. `--primary` in dark mode is `--primary-light`, which only reaches 3.67:1 with white.
   - `--primary-dark` / `--secondary-dark` for text on a white, tinted or light surface that stays light in dark mode too: the compact navbar, the contact window, the search suggestions, the profile bubble, article cards, the blog's `bg-light` author box, the hero's tinted half (light mode).
   - `--primary-light` for blue text on black (the mobile menu button, the footer links on hover).
   - `--primary-dark` for focus rings (3:1 or more on white, the pale language pill and black), white on the blue Hire me band.
2. **Darken instead of fading.** `opacity` lets the page show through and lightens what is behind the text. For hover, darken the fill (`color-mix(in srgb, <colour>, var(--black) 20%)`) or fill it with `--primary-dark`; never fade it.
3. **Overlays on photos**: raise the overlay's opacity or use a darker colour for it, and check the result at every width, because the text moves over a different part of the photo on each device (the Hire me overlay is `--primary-dark` at 85%, the project overlays at 95%).
4. **Make hidden content show for the keyboard too**: what opens on `:hover` must also open on `:focus-within` (the project cards), or a focused link stays invisible.
5. Only then change the colour itself, and ask the user first, since it changes the identity of the site.

Things to keep in mind:

- In dark mode, `--primary` and `--secondary` are switched on `body`, not on `html`. A script that needs a colour reads it with `cssVarToHex()` (`js/app.js`), not from `document.documentElement`.
- Git checks files out with CRLF line endings on this machine (`core.autocrlf`) and commits them as LF: a script that edits a file must match CRLF as well as LF line breaks.
- Run `npm run lint:css` after editing CSS.
- A new component that only shows after a click or a keystroke needs its entry in `INTERACTIONS` in `check-contrast.mjs` (a trigger, how to open and close it, the region to check).

## Report

Give the user the result in numbers: what failed (kind, element, ratio, needed ratio, page, size, theme), what changed and why, and the final **PASS** of a full run. If the check could not run (no browser, build error), say so; never call a colour change done without a passing full run.

## What it does not cover

- Third-party widgets drawn in their own frame or shadow root once loaded: the Botpress chat window and the Calendly booking popup (their launcher buttons are checked).
- Text inside images, and text with partial transparency over a photo (the pixel measure only counts pixels of the text's own colour).
- The `:active` (pressed) and `:visited` states.
