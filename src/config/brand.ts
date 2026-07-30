/**
 * ══════════════════════════════════════════════════════════════════
 *  THE SINGLE SOURCE OF TRUTH FOR THE BRAND COLOUR AND FONTS
 * ══════════════════════════════════════════════════════════════════
 *
 * Change the constants below and the entire site follows: buttons,
 * links, badges, borders, gradients, focus rings, the logo, the
 * preloader, every hover state — and every piece of type.
 *
 * Nothing here is read from the database. Both the palette and the
 * font stack are compiled into the page on the server (see
 * `brandCssVariables()` injected by `src/app/layout.tsx`), so there is
 * never a flash of the wrong colour or typeface, and both work with
 * JavaScript disabled.
 *
 * To reuse this codebase for another shop: edit `BRAND_PRIMARY` and
 * `BRAND_FONT`. That is the whole job.
 */

/* ─────────────── COLOUR ─────────────── */

/** ⬇⬇⬇  THE ONE COLOUR VARIABLE  ⬇⬇⬇ */
export const BRAND_PRIMARY = '#3A6451';

/** Accent used alongside the primary (defaults to the primary itself). */
export const BRAND_SECONDARY = BRAND_PRIMARY;

/* ─────────────── TYPOGRAPHY ─────────────── */

/** ⬇⬇⬇  THE ONE FONT VARIABLE  ⬇⬇⬇  Body text across the whole site. */
export const BRAND_FONT = 'Poppins';

/**
 * Headings. Set it to the same face as `BRAND_FONT` for one uniform
 * voice, or name a display face (e.g. 'Teko') to give titles their own
 * character — nothing else needs to change either way.
 */
export const BRAND_FONT_HEADING = BRAND_FONT;

/**
 * Bengali companion. Latin faces such as Poppins ship no বাংলা glyphs,
 * and browsers fall back per glyph — so this face renders the Bengali
 * inside an otherwise-Latin sentence. Keep it last in every stack.
 */
export const BRAND_FONT_BANGLA = 'Hind Siliguri';

/** Weights requested from Google Fonts for each family. */
const FONT_WEIGHTS = '300;400;500;600;700';

/** Quoted CSS font stack, always ending in the Bengali face + a generic. */
const stack = (family: string) =>
    `'${family}', '${BRAND_FONT_BANGLA}', sans-serif`;

export const fonts = {
    body: stack(BRAND_FONT),
    heading: stack(BRAND_FONT_HEADING),
    bangla: `'${BRAND_FONT_BANGLA}', sans-serif`,
} as const;

/**
 * The Google Fonts stylesheet URL, built from the constants above so a
 * font swap never leaves a stale <link> behind. Duplicate families are
 * requested once.
 */
export function brandFontsHref(): string {
    const families = [...new Set([BRAND_FONT, BRAND_FONT_HEADING, BRAND_FONT_BANGLA])];
    const query = families
        .map((f) => `family=${f.trim().replace(/\s+/g, '+')}:wght@${FONT_WEIGHTS}`)
        .join('&');
    return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/* ─── Colour maths — every shade below is derived from BRAND_PRIMARY ─── */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return {
        r: parseInt(full.substring(0, 2), 16),
        g: parseInt(full.substring(2, 4), 16),
        b: parseInt(full.substring(4, 6), 16),
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix the colour toward black. `amount` 0 → unchanged, 1 → black. */
function darken(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Mix the colour toward white. `amount` 0 → unchanged, 1 → white. */
function lighten(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/** "58, 100, 81" — for `rgba(var(--color-primary-rgb), 0.12)` translucency. */
function rgbTriplet(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
}

/* ─── The generated palette ─── */

export const brand = {
    primary: BRAND_PRIMARY,
    primaryDark: darken(BRAND_PRIMARY, 0.18),
    primaryDarker: darken(BRAND_PRIMARY, 0.34),
    primaryLight: lighten(BRAND_PRIMARY, 0.85),
    primaryLighter: lighten(BRAND_PRIMARY, 0.9),
    primaryLightest: lighten(BRAND_PRIMARY, 0.93),
    primaryBorder: lighten(BRAND_PRIMARY, 0.7),
    primarySurface: lighten(BRAND_PRIMARY, 0.96),
    /** Mid-tone used in the shimmer highlight of progress bars. */
    primaryGlow: lighten(BRAND_PRIMARY, 0.5),
    primaryRgb: rgbTriplet(BRAND_PRIMARY),
    secondary: BRAND_SECONDARY,
} as const;

/**
 * The `:root` block that carries the palette AND the font stack into CSS.
 *
 * Rendered into `<head>` on the server by `layout.tsx`, so all ~840
 * `var(--color-primary)` references and every `var(--font-family)` across
 * the app resolve on the very first paint.
 */
export function brandCssVariables(): string {
    return `:root{
--color-primary:${brand.primary};
--color-primary-rgb:${brand.primaryRgb};
--color-primary-dark:${brand.primaryDark};
--color-primary-darker:${brand.primaryDarker};
--color-primary-light:${brand.primaryLight};
--color-primary-lighter:${brand.primaryLighter};
--color-primary-lightest:${brand.primaryLightest};
--color-primary-border:${brand.primaryBorder};
--color-primary-surface:${brand.primarySurface};
--color-primary-glow:${brand.primaryGlow};
--color-secondary:${brand.secondary};
--color-sale:${brand.primary};
--font-family:${fonts.body};
--font-heading:${fonts.heading};
--font-bangla:${fonts.bangla};
}`;
}

/**
 * The favicon, as a self-contained `data:` URI.
 *
 * A file-based `app/icon.svg` is served standalone — outside the page's CSS
 * cascade — so `var(--color-primary)` cannot resolve inside it. Building the
 * markup here instead keeps the favicon on the same single source of truth as
 * everything else. Wired up via `metadata.icons` in `src/app/layout.tsx`.
 */
export function brandFaviconDataUri(letter = 'S'): string {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">` +
        `<rect width="64" height="64" rx="14" fill="${brand.primary}"/>` +
        `<text x="32" y="48" text-anchor="middle" font-family="Segoe UI, system-ui, Arial, sans-serif" ` +
        `font-weight="800" font-size="42" fill="#ffffff">${letter}</text>` +
        `</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default brand;
