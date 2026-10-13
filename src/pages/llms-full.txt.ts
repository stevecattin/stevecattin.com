import type { APIRoute } from 'astro';
import { INTRO, OUTRO, getPosts, postDate, postUrl, textResponse, writingSections } from '../lib/llms';

/* Same map as /llms.txt, followed by the full Markdown of every published
   essay, so an assistant can read the writing in one fetch. */
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const essays = posts
    .map(
      (post) =>
        `---\n\n# ${post.data.title}\n\nPublished ${postDate(post)} · ${post.data.category} · ${postUrl(post)}\n\n${post.body.trim()}\n`,
    )
    .join('\n');
  return textResponse(`${INTRO}${writingSections(posts)}${OUTRO}\n# Essays\n\n${essays}`);
};
