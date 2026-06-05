import { revalidatePath } from 'next/cache';

/** Invalidate sitemap, blog index, and post URLs after admin blog mutations. */
export function revalidateBlogPublicRoutes(options: { slug?: string; previousSlug?: string }) {
  revalidatePath('/sitemap.xml');
  revalidatePath('/feed.xml');
  revalidatePath('/blog');
  if (options.slug) {
    revalidatePath(`/blog/${options.slug}`);
  }
  if (options.previousSlug && options.previousSlug !== options.slug) {
    revalidatePath(`/blog/${options.previousSlug}`);
  }
}
