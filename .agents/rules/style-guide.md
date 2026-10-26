---
trigger: always_on
---

# UrConnections UI style guide: "Aspirational Minimalism" with an adaptive theme

UrConnections helps people find study and interest groups by topic, place and platform.
The UI is calm, Apple-like and content-first: the groups are the content, the UI only frames them.
Build pages from the UI kit in `web/src/components/ui`; colors are the `@theme` tokens in `web/src/index.css`.

## 1. Design philosophy
- **Minimalism as quality**: whitespace is an active design element. Every element needs a clear purpose.
- **Band structure**: pages are built from full-width horizontal sections (bands) that alternate background
  (white / light gray `#f5f5f7` in light mode; black / deep gray `#1d1d1f` in dark mode) to separate content.

## 2. Typography
- **Font**: Inter (self-hosted via `@fontsource-variable/inter`) everywhere.
- **Display headlines**: very large (`text-5xl` to `text-8xl`), black weight, tight tracking (`PageHero`).
- **Subheadings**: smaller, medium weight, directly under the headline.
- **Body copy**: short, with generous line height.
- **Contrast**: black on white, white on black. Muted gray only for secondary text (labels, hints, footer).

## 3. Components
- **Navigation**: sticky at the top with a backdrop blur, semi-transparent white (light) or deep gray (dark).
  Logo, account links (Sign In / Profile / Sign Out) and the "Create Group" button.
- **Home hero**: search-centric. A large search input ("Find your group by interest") and a headline.
- **Filter bar**: sticky under the nav: Country, City, Platform selects and topic pills.
- **Group grid**: responsive 1–4 columns of group cards.
- **Group card**: topic tag, platform badge, title, short description, location (City, Country), and a clear
  primary action ("Connect now") plus "View Details". Owners also see Edit / Delete.
- **Footer**: dark, multi-column links (Explore, Account) and the copyright line.

## 4. Color and motion
- **One accent color**, `#0071e3` (`bg-accent`), used sparingly for primary actions and highlights.
  It must stay readable in both themes.
- **Motion**: subtle and fast: fades, small scale on hover, smooth color transitions. Use `transition`
  (not `transition-all`) and keep blur light, for performance.

## 5. Dark mode
- Follows the system setting (`prefers-color-scheme`, Tailwind `dark:`). *Planned (audit R7):* a manual toggle.
- A color-space shift, not an inversion: white → black for main backgrounds, `#f5f5f7` → `#1d1d1f` for
  alternating or nested sections. Elevated surfaces get slightly lighter grays, never black on black.
- Text flips to white; long body text may use off-white `#f5f5f7`.
- Shadows are rare. In dark mode, show elevation with lighter borders or a subtle glow, not black shadows.

## 6. User experience
- **Zero friction**: the home page pre-selects the visitor's country/city (IP location) on a first visit,
  so local groups show at once. Filters live in the URL, so results can be shared and bookmarked.
- **Action-oriented**: every card has one clear primary action, keeping discovery-to-joining short.
- **Accessible by default**: labels linked to inputs, `aria-pressed` on toggles, text at least 11–12px,
  focus visible, native `<dialog>` for confirmations.
- *Planned (audit R8):* social proof such as member counts or "X groups in your city" (needs a members
  concept in the data model).
