import React from 'react';

/**
 * S Kawsar Sunnah Mart brand logo.
 *
 * Three renderings of the same mark:
 *
 *  • default        — the full artwork (`public/logo.png`), for light surfaces.
 *  • `light`        — the emblem (`public/logo-mark.png`) beside a white HTML
 *                     wordmark, for dark surfaces such as the brand-green header
 *                     and the admin sidebar.
 *  • `iconOnly`     — the emblem alone, for tight spaces.
 *
 * Why `light` rebuilds the wordmark instead of just dropping the artwork on the
 * dark background: the artwork's lettering is mid-green (#699530), which
 * measures only 1.9:1 against the header green — effectively invisible. Setting
 * the wordmark as white HTML text lifts it to 6.7:1 (WCAG AA) and keeps it crisp
 * at any size, while the emblem keeps its original green-and-gold colour.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** On a dark background — emblem + white wordmark. */
    light?: boolean;
    /** Wrap the full artwork in a white rounded chip. */
    boxed?: boolean;
    /** Kept for API compatibility (no-op). */
    showTagline?: boolean;
    /** Render only the compact emblem (no wordmark) — for tight spaces. */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the logo (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

const LOGO_FULL = '/logo.png';
const LOGO_MARK = '/logo-mark.png';

const Logo: React.FC<LogoProps> = ({
    size = 40,
    light = false,
    boxed = false,
    iconOnly = false,
    className,
    imgClassName,
}) => {
    const heightStyle = imgClassName ? undefined : { height: size };
    const imgStyle: React.CSSProperties = { ...heightStyle, width: 'auto', display: 'block' };

    const mark = (src: string) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt="S Kawsar Sunnah Mart"
            draggable={false}
            className={imgClassName}
            style={imgStyle}
        />
    );

    if (iconOnly) {
        return (
            <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
                {mark(LOGO_MARK)}
            </span>
        );
    }

    // Dark surface — colour emblem + white wordmark.
    if (light && !boxed) {
        return (
            <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                {mark(LOGO_MARK)}
                {/* Sized so the whole wordmark block sits a little under the emblem's
                    height — the emblem stays the dominant element. */}
                <span className="flex flex-col justify-center leading-none">
                    <span className="font-heading text-[16px] font-bold uppercase leading-[0.95] tracking-[0.01em] text-white sm:text-[18px] md:text-[21px]">
                        S Kawsar
                    </span>
                    <span className="mt-[2px] text-[6px] font-semibold uppercase leading-none tracking-[0.30em] text-white/75 sm:text-[6.5px] md:text-[7.5px]">
                        Sunnah Mart
                    </span>
                </span>
            </span>
        );
    }

    if (boxed) {
        return (
            <span
                className={className}
                style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '5px 10px' }}
            >
                {mark(LOGO_FULL)}
            </span>
        );
    }

    return (
        <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {mark(LOGO_FULL)}
        </span>
    );
};

/** Compact brand mark — same logo API, used where space is tight. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;
