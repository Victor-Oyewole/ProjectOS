import type { Config } from "tailwindcss";

// Doc 18 Section 1 -- design tokens. Color values reference the CSS custom
// properties in globals.css (single source of truth, also readable by
// plain CSS/inline styles if ever needed) rather than being duplicated
// here as literal hex. Radius/shadow/duration keys deliberately override
// Tailwind's own `sm`/`md`/`lg` steps instead of introducing new names --
// every existing `rounded-md`, `shadow-sm`, etc. across the app picks up
// the spec'd values automatically, with no per-file class renaming needed.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        ink: {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          disabled: "var(--color-text-disabled)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-lexend)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Doc 18's type scale (text-xs through text-3xl, including line
      // heights) is not overridden here -- Tailwind's defaults for those
      // exact step names already match the spec's px values 1:1 (in rem,
      // which is the more accessible unit for font sizing -- see the
      // spacing note below).
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.07)",
        lg: "0 10px 15px rgba(0,0,0,0.10)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      // Doc 18's spacing scale (4/8/12/16/20/24/32/40/48/64px) is not
      // overridden here -- Tailwind's default `space-1`..`space-16` steps
      // already equal these exact values (in rem, which scales correctly
      // with a user's browser font-size setting; hardcoding px here would
      // have been a strictly worse, less accessible match for the same
      // numbers).
    },
  },
  plugins: [],
} satisfies Config;
