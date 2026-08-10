/**
 * Open Graph card generator — stevecattin.com
 *
 * Renders 1200x630 social cards into public/og/ :
 *   • og-default.png        – homepage + any page without its own card
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

/* Satori can't decode webp, so the portrait goes through sharp first. */
async function portraitDataUri() {
  const buf = await sharp(path.join(ROOT, 'public', 'portrait-street.webp'))
    .resize(500, HEIGHT, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 88 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

/* ---------- shared pieces ---------- */

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

function defaultCard(portrait) {
  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        background: PAPER,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '72px 64px',
              width: 700,
            },
            children: [
              eyebrow('Fractional Executive. Advisor. Sparring Partner.'),
              {
                type: 'div',
                props: {
                  style: {
                    /* Two explicit lines, breaking where the homepage hero
                       breaks – left to wrap on its own, "of" ends up
                       stranded on a line by itself. */
                    display: 'flex',
                    flexDirection: 'column',
                    whiteSpace: 'nowrap',
                    fontFamily: DISPLAY,
                    fontSize: 64,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.02,
                    color: INK,
                  },
                  children: [
                    { type: 'div', props: { children: "We're all made of" } },
                    {
                      type: 'div',
                      props: { style: { color: COBALT, fontWeight: 700 }, children: 'stories.' },
                    },
                  ],
                },
              },
              signature(),
            ],
          },
        },
        {
          type: 'img',
          props: {
            src: portrait,
            width: 500,
            height: HEIGHT,
            style: { objectFit: 'cover' },
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
  await writeFile(outPath, png);
  return outPath;
}

async function main() {
  const fonts = await loadFonts();
  const outDir = path.join(ROOT, 'public', 'og');
  await mkdir(outDir, { recursive: true });

  const written = [];

  written.push(
    await render(
      defaultCard(await portraitDataUri()),
      fonts,
      path.join(ROOT, 'public', 'og-default.png')
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
