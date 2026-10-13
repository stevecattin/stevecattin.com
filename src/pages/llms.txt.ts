import type { APIRoute } from 'astro';
import { INTRO, OUTRO, getPosts, textResponse, url, writingSections } from '../lib/llms';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const full = `\nThe full text of every essay is at [llms-full.txt](${url('/llms-full.txt')}).\n`;
  return textResponse(INTRO + writingSections(posts) + OUTRO + full);
};
