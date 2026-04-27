# stevecattin.com

Personal site for Stève Cattin. Fractional CEO, executive advisor, coach.

Built with **Astro 5**, plain CSS, MDX for writing. No WordPress, no theme. Authored via Cursor, version-controlled in Git/GitHub, deployed to a private server.

## Quick start

```bash
# 1. Install
npm install

# 2. Run the dev server (http://localhost:4321)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the built site locally
npm run preview
```

Requires **Node 20+**. Recommended: pnpm or npm; lockfile is committed either way.

## Project structure

```
stevecattin-site/
├── astro.config.mjs          # Astro config (site URL, integrations)
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.svg           # Placeholder – replace with real 3D "S." asset
├── src/
│   ├── components/           # Nav, Footer, PostCard, CTABlock
│   ├── content/
│   │   ├── config.ts         # Blog collection schema
│   │   └── blog/*.mdx        # Posts
│   ├── layouts/              # BaseLayout, PostLayout
│   ├── pages/
│   │   ├── index.astro       # Home
│   │   ├── about.astro       # About
│   │   ├── blog/
│   │   │   ├── index.astro   # Writing index
│   │   │   └── [...slug].astro  # Post template
│   │   └── rss.xml.js        # RSS feed
│   ├── styles/
│   │   ├── tokens.css        # Design tokens – single source of truth
│   │   └── global.css        # Reset, typography, layout primitives
│   └── env.d.ts
└── README.md                 # This file
```

## Design system

All design tokens live in `src/styles/tokens.css`. Change one value there and the site follows. The direction is **Modernized Current** (see `../creative-direction-v2.html`, Direction 06).

Key tokens:

| Token | Value | Where it lives |
|---|---|---|
| `--color-paper` | `#FAFAF8` | Page background |
| `--color-ink` | `#101114` | Primary text, strong type |
| `--color-cobalt` | `#2830FF` | Primary accent, links, CTA |
| `--color-amber` | `#E5A100` | Eyebrow accents |
| `--font-display` | Inter Tight | Headlines |
| `--font-body` | Inter | Prose |
| `--font-mono` | JetBrains Mono | Eyebrows, metadata |
| `--font-accent` | Fraunces italic | The word "stories" and similar accents |

### Voice

All copy is written per the `write-in-my-voice` skill. Mechanical rules worth remembering:

- **En dashes (–), not em dashes (—).** Always.
- Deliberate sentence fragments are fine. Lines like "Less, better." are load-bearing.
- No corporate buzzwords. No "I hope this finds you well."
- Personal writing signs off with `–S.`
- Cut before you add.

Before touching copy, re-read `/sessions/.../mnt/.claude/skills/write-in-my-voice/SKILL.md`.

## Adding a new blog post

Create a file at `src/content/blog/my-post-slug.mdx`:

```mdx
---
title: "A post title, quoted if it contains punctuation"
description: "One-sentence description that shows up on the index and in previews."
pubDate: 2026-05-01
category: "Leadership"
readingTime: "4 min read"
---

Opening paragraph. No filler. No "In this post I will…"

Body of the post. MDX means you can use Astro components if you want, but most
posts are fine as pure prose. Keep it honest.

–S.
```

The blog index, home page previews, RSS feed, and sitemap update automatically.

## Migrating from WordPress

The old site is WordPress + The7 theme. To bring posts over:

1. **Export** from WordPress Admin → Tools → Export → "All content" → download WXR XML.
2. **Convert WXR → Markdown.** Options:
   - `wordpress-export-to-markdown` (`npx wordpress-export-to-markdown`) – simplest, dumps each post as a `.md` file with YAML frontmatter.
   - Custom script with `xml2js` if the WXR has custom fields we care about.
3. **Normalize frontmatter** so each post matches our schema (`src/content/config.ts`):
   - `title` → already there
   - `description` → extract from excerpt or write a fresh one-liner
   - `pubDate` → already there, check timezone
   - `category` → map WP categories to our slim set (Leadership / Founder notes / Brand / Personal)
   - `readingTime` → compute from word count (`wpm = 225`)
4. **Rename `.md` → `.mdx`** and drop into `src/content/blog/`.
5. **Clean images.** Pull any referenced images from the WP upload folder into `public/images/blog/<slug>/`, and rewrite the markdown paths.
6. **Review and rewrite.** Some posts from the WordPress era won't match the new voice. Either rewrite them or leave them out. This is a good chance to prune.

### Redirects

If you want old URLs like `/2023/04/post-slug/` to map to new ones like `/blog/post-slug/`, add them in the hosting layer (nginx / Caddy / Vercel `_redirects`). Astro doesn't need to know.

## Deployment

This repo is stack-agnostic – `npm run build` produces a static site in `dist/`. Drop that on any static host or serve from the target server via nginx.

Suggested first deploy path:
1. Point GitHub repo at the server.
2. CI runs `npm ci && npm run build` on push to `main`.
3. Rsync `dist/` to the server's webroot.
4. nginx serves it. Done.

## What's not built yet

- **Framework page** – deeper walkthrough of the three engagement modes. Home has the summary; this would be the long version.
- **Case studies / work page** – once there are a couple of written-up fractional engagements worth surfacing.
- **Newsletter capture** – intentional omission for now. Can bolt on later via a light form component.
- **Dark mode** – tokens are set up to make this easy, not wired in yet.

## Housekeeping

- `CHANGELOG.md` – not set up. Use git history for now.
- `Analytics` – not wired in. Plausible or Fathom recommended when the time comes; keep it cookie-free.
- `OG image` – currently a static placeholder at `/og-default.png` (not checked in). Ship a real one before going public.

---

For creative direction reference, see `../creative-direction-v2.html` (Direction 06 is what got built).
