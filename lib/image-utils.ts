/**
 * Get the image URL for portfolio images. Blob URLs are routed through the proxy
 * to fix 403 errors (proxy fetches with BLOB_READ_WRITE_TOKEN when needed).
 * Set NEXT_PUBLIC_USE_IMAGE_PROXY=false to bypass proxy and load directly.
 */
export function getPortfolioImageUrl(url: string): string {
  if (!url || !url.startsWith('http')) return url;

  const useProxy = process.env.NEXT_PUBLIC_USE_IMAGE_PROXY !== 'false';
  const isBlobUrl =
    url.includes('.public.blob.vercel-storage.com') ||
    url.includes('.private.blob.vercel-storage.com');

  if (useProxy && isBlobUrl) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}
