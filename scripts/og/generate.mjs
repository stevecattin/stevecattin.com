/**
 * Open Graph card generator — stevecattin.com
 *
 * Renders 1200x630 social cards into public/og/ :
 *   • og/home.jpg           – homepage + any page without its own card,
 *                             in the homepage's look (light, portrait disc).
 *                             JPEG, not PNG: the grain made the PNG 1.1 MB,
 *                             and LinkedIn quietly drops heavy cards. The URL
 *                             also had to change – LinkedIn had cached the old
 *                             /og-default.png from back when it 404'd, and fell
 *                             back to the hero portrait on the page.
 *   • og/<post-slug>.png    – one per published blog post
 *
 * Runs automatically before every build (see package.json "prebuild"), so a
 * new post gets a card without anyone remembering to do anything.
 *
 * Type is drawn with static instances of the site's variable fonts, sitting
 * in scripts/og/fonts/. Satori can't read woff2 or variable axes, hence the
 * conversion — regenerate them with scripts/og/build-fonts.py if the type
 * system ever changes.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import matter from 'gray-matter';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const WIDTH = 1200;
const HEIGHT = 630;

/* Palette — mirrors src/styles/tokens.css. Four colors, no exceptions. */
const PAPER = '#FAFAF8';
const INK = '#101114';
const GRAPHITE = '#3B3D44';
const COBALT = '#2830FF';
const LINE = 'rgba(0, 0, 0, 0.10)';

const DISPLAY = 'Cabinet Grotesk';
const BODY = 'General Sans';

async function loadFonts() {
  const dir = path.join(HERE, 'fonts');
  const [displayMedium, displayBold, bodyRegular, bodyMedium] = await Promise.all([
    readFile(path.join(dir, 'CabinetGrotesk-Medium.ttf')),
    readFile(path.join(dir, 'CabinetGrotesk-Bold.ttf')),
    readFile(path.join(dir, 'GeneralSans-Regular.ttf')),
    readFile(path.join(dir, 'GeneralSans-Medium.ttf')),
  ]);

  return [
    { name: DISPLAY, data: displayMedium, weight: 500, style: 'normal' },
    { name: DISPLAY, data: displayBold, weight: 700, style: 'normal' },
    { name: BODY, data: bodyRegular, weight: 400, style: 'normal' },
    { name: BODY, data: bodyMedium, weight: 500, style: 'normal' },
  ];
}

/* Satori can't decode webp, so the portrait goes through sharp first.
   The homepage portrait: head breaking out of a cool-paper disc, on a
   transparent background – the same file the hero uses. */
const PORTRAIT_W = 436;
const PORTRAIT_H = 520;

async function portraitDataUri() {
  const buf = await sharp(path.join(ROOT, 'public', 'portrait-hero.webp'))
    .resize(PORTRAIT_W * 2, PORTRAIT_H * 2, { fit: 'inside' })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/* The homepage light, frozen on one frame: soft blue lights and one coral
   spark on paper, with the site's white grain on top. Mirrors
   GlowBackground.astro (colors, blur, 0.4 strength), scaled to the card.
   Satori can't blur, so this is drawn as its own SVG and laid under the
   card as a background image. (Opacity sits on each light, as on the site –
   resvg drops filtered shapes inside a group with opacity.) */
const GLOW_STRENGTH = 0.4;

async function glowDataUri() {
  const grain = await readFile(path.join(ROOT, 'public', 'images', 'grain-light.png'));
  const grainUri = `data:image/png;base64,${grain.toString('base64')}`;

  // [cx, cy, diameter, blur, inner, outer, gradient centre]
  const lights = [
    [10, -60, 560, 150, '#7FA0FF', '#3D5BFF', '50%'], // small bright blue, top-left corner
    [918, 315, 680, 135, '#7FA0FF', '#3D5BFF', '50%'], // big blue, parked behind the portrait
    [30, 720, 480, 125, '#4D6BFF', COBALT, '50%'], // cobalt, low left, mostly off-card
    [600, 600, 320, 75, '#FBB39F', '#F96B54', '40%'], // the coral spark
  ];

  const defs = lights
    .map(([, , , blur, inner, outer, c], i) => `
      <radialGradient id="g${i}" cx="${c}" cy="${c}" r="71%">
        <stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/>
      </radialGradient>
      <filter id="b${i}" x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="${blur}"/>
      </filter>`)
    .join('');

  const circles = lights
    .map(([cx, cy, d], i) =>
      `<circle cx="${cx}" cy="${cy}" r="${d / 2}" fill="url(#g${i})" filter="url(#b${i})" opacity="${GLOW_STRENGTH}"/>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WIDTH}" height="${HEIGHT}">
    <defs>${defs}
      <pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse">
        <image href="${grainUri}" xlink:href="${grainUri}" width="256" height="256"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="${PAPER}"/>
    ${circles}
    <rect width="100%" height="100%" fill="url(#grain)" opacity="0.6"/>
  </svg>`;

  const png = new Resvg(svg).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

/* ---------- shared pieces ---------- */

const ARROW = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">' +
    '<path d="M3 10h13.5M11 4.5l5.5 5.5-5.5 5.5" fill="none" stroke="#FFFFFF" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
).toString('base64')}`;

const eyebrow = (text, color = COBALT) => ({
  type: 'div',
  props: {
    style: {
      display: 'flex',
      alignItems: 'center',
      fontFamily: BODY,
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color,
    },
    children: text,
  },
});

const signature = () => ({
  type: 'div',
  props: {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: BODY,
      fontSize: 20,
      fontWeight: 500,
      color: GRAPHITE,
    },
    children: [
      {
        type: 'div',
        props: {
          style: { width: 8, height: 8, borderRadius: 8, background: COBALT, display: 'flex' },
        },
      },
      { type: 'div', props: { children: 'Stève Cattin · stevecattin.com' } },
    ],
  },
});

/* ---------- card layouts ---------- */

function defaultCard({ glow, portrait }) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        position: 'relative',
        background: PAPER,
      },
      children: [
        {
          type: 'img',
          props: {
            src: glow,
            width: WIDTH,
            height: HEIGHT,
            style: { position: 'absolute', top: 0, left: 0 },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '60px 0 64px 72px',
              width: 700,
            },
            children: [
              /* The nav lockup: name, hairline, role. */
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontFamily: DISPLAY, fontSize: 25, fontWeight: 500, color: INK },
                        children: 'Stève Cattin',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: BODY,
                          fontSize: 21,
                          fontWeight: 400,
                          color: GRAPHITE,
                          marginLeft: 16,
                          paddingLeft: 16,
                          borderLeft: '1px solid rgba(16, 17, 20, 0.2)',
                        },
                        children: 'Fractional CMO & GTM Advisor',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    /* Two explicit lines, breaking where the homepage hero
                       breaks. The accent word keeps the headline's weight –
                       the color marks it, not a heavier cut. */
                    display: 'flex',
                    flexDirection: 'column',
                    whiteSpace: 'nowrap',
                    fontFamily: DISPLAY,
                    fontSize: 80,
                    fontWeight: 500,
                    letterSpacing: '-0.03em',
                    lineHeight: 0.98,
                    color: INK,
                  },
                  children: [
                    { type: 'div', props: { children: 'When growth gets' } },
                    { type: 'div', props: { style: { color: COBALT }, children: 'complicated' } },
                  ],
                },
              },
              /* The hero's one button, then the address. */
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 28 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontFamily: BODY,
                          fontSize: 20,
                          fontWeight: 500,
                          letterSpacing: '0.01em',
                          color: '#FFFFFF',
                          background: COBALT,
                          padding: '16px 26px 16px 28px',
                          borderRadius: 3,
                        },
                        /* The site's fonts have no → glyph, so the arrow is drawn. */
                        children: [
                          { type: 'div', props: { children: 'Tell me your story' } },
                          { type: 'img', props: { src: ARROW, width: 20, height: 20 } },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontFamily: BODY, fontSize: 20, fontWeight: 500, color: GRAPHITE },
                        children: 'stevecattin.com',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: 'img',
          props: {
            src: portrait,
            width: PORTRAIT_W,
            height: PORTRAIT_H,
            style: { position: 'absolute', right: 64, top: (HEIGHT - PORTRAIT_H) / 2 },
          },
        },
      ],
    },
  };
}

function postCard({ title, category }) {
  /* Long titles step down a size so three lines still clear the signature. */
  const fontSize = title.length > 68 ? 58 : title.length > 42 ? 68 : 78;

  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        padding: '72px 80px',
        borderTop: `10px solid ${COBALT}`,
      },
      children: [
        eyebrow(category ?? 'Writing'),
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: DISPLAY,
              fontSize,
              fontWeight: 500,
              letterSpacing: '-0.025em',
              lineHeight: 1.06,
              color: INK,
              maxWidth: 1000,
            },
            children: title,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${LINE}`,
              paddingTop: 28,
            },
            children: [
              signature(),
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: BODY,
                    fontSize: 18,
                    fontWeight: 400,
                    color: GRAPHITE,
                  },
                  children: 'Essays on leadership, marketing and the work',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/* ---------- render ---------- */

async function render(tree, fonts, outPath) {
  const svg = await satori(tree, { width: WIDTH, height: HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
    .render()
    .asPng();
  /* Photographic cards (portrait, light, grain) go out as JPEG; flat type
     cards stay PNG, where they're already small and crisp. */
  const out = outPath.endsWith('.jpg')
    ? await sharp(png).flatten({ background: PAPER }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
    : png;
  await writeFile(outPath, out);
  return outPath;
}

async function main() {
  const fonts = await loadFonts();
  const outDir = path.join(ROOT, 'public', 'og');
  await mkdir(outDir, { recursive: true });

  const written = [];

  written.push(
    await render(
      defaultCard({ glow: await glowDataUri(), portrait: await portraitDataUri() }),
      fonts,
      path.join(outDir, 'home.jpg')
    )
  );

  const blogDir = path.join(ROOT, 'src', 'content', 'blog');
  const entries = (await readdir(blogDir)).filter((f) => /\.mdx?$/.test(f));

  for (const file of entries) {
    const raw = await readFile(path.join(blogDir, file), 'utf8');
    const { data } = matter(raw);
    if (data.draft) continue;

    const slug = file.replace(/\.mdx?$/, '');
    written.push(
      await render(
        postCard({ title: data.title, category: data.category }),
        fonts,
        path.join(outDir, `${slug}.png`)
      )
    );
  }

  console.log(`[og] generated ${written.length} cards`);
  for (const f of written) console.log(`[og]   ${path.relative(ROOT, f)}`);
}

main().catch((err) => {
  console.error('[og] generation failed:', err);
  process.exit(1);
});
