/* Shared content for /llms.txt and /llms-full.txt.
   llms.txt is a plain-Markdown map of the site for AI assistants and agents
   (spec: https://llmstxt.org). The intro below is hand-written positioning;
   the writing list is generated from the blog collection, so new posts
   appear on the next build without touching this file. */

import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

const SITE = 'https://stevecattin.com';
export const url = (path: string) => new URL(path, SITE).href;

/* Personal essays go under "Optional" – the llms.txt convention for
   material an assistant can skip when context is tight. */
const PERSONAL = 'Personal';

export const INTRO = `# Stève Cattin

> Fractional executive, advisor and sparring partner for founders, CEOs and their teams, based in Zürich. Twenty years across GTM, Operations and People – fifteen in B2B tech, two acquisitions from the inside. He works with companies that have scaled faster than the way they're run. Marketing is usually where the strain shows first. The real work is the operating model underneath.

Stève has built marketing from inside scaling companies, never from the agency side of the table. At Locatee his remit widened from Head of Marketing to Head of People to VP of Operations, and he sat on the four-person deal team for its sale to Tango. At Tango he became SVP Marketing and joined the executive leadership team. He opened Locatee's first US office from Zürich and has run teams on both sides of the Atlantic. He works in French, English, German and Italian.

## Working with Stève

- Fractional executive: one to three days a week, in the seat. Usually enters on the most exposed function – often marketing or GTM – and works across the whole company from there.
- Advisory: a regular cadence outside the org chart, for founders and execs who have a team and a plan and want a senior operator to pressure-test it.
- Private sparring: confidential, off the org chart, for leaders whose hardest problem is the one they're carrying themselves.
- Typical situations: a company that has outgrown its marketing, GTM under pressure, European companies expanding to North America (or the reverse), a founder whose team is stuck, an exit or restructuring ahead, a board or investor with a portfolio company that is well-funded and still slow.
- First step: a forty-five-minute conversation, no deck. Email hello@stevecattin.com or use the contact form on any page.

## Pages

- [Home](${url('/')}): Who Stève works with and the pattern he keeps seeing – companies scaling faster than the way they're run.
- [Work with me](${url('/practice/')}): The three ways to work together, the situations he's suited to, and what he brings to the room.
- [About](${url('/about/')}): Six facets (operator, storyteller, culture builder, demand generator, cross-border bridge, human), a career timeline from 2005 to today, and how he works.
- [The AI Marketing Ascendancy Framework](${url('/aima/')}): Stève's framework for moving marketing teams from AI-curious to AI-confident – challenges, a use-case library, a maturity model across people, processes and technology, and a role-based growth framework.
`;

export const OUTRO = `
## Elsewhere

- [LinkedIn](https://www.linkedin.com/in/stevecattin): Full career history and recommendations.
- [RSS feed](${url('/rss.xml')}): New writing as it's published.
`;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: Post) => url(`/blog/${post.slug}/`);
export const postDate = (post: Post) => post.data.pubDate.toISOString().slice(0, 10);

const postLine = (post: Post) =>
  `- [${post.data.title}](${postUrl(post)}): ${post.data.description} (${post.data.category}, ${postDate(post)})`;

export function writingSections(posts: Post[]): string {
  const work = posts.filter((p) => p.data.category !== PERSONAL);
  const personal = posts.filter((p) => p.data.category === PERSONAL);
  let out = `\n## Writing\n\n${work.map(postLine).join('\n')}\n`;
  if (personal.length) {
    out += `\n## Optional\n\n${personal.map(postLine).join('\n')}\n`;
  }
  return out;
}

export const textResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
