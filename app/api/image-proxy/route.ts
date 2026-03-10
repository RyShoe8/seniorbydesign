import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';

const BLOB_DOMAIN_REGEX = /^https:\/\/([a-z0-9]+)\.(?:public|private)\.blob\.vercel-storage\.com\//;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL is from Vercel Blob storage
  if (!BLOB_DOMAIN_REGEX.test(url)) {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  const storeId = url.match(BLOB_DOMAIN_REGEX)?.[1] ?? 'unknown';
  const pathname = new URL(url).pathname.slice(1);
  const access = url.includes('.private.blob.vercel-storage.com') ? 'private' : 'public';
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const tryGet = async (pathnameOrUrl: string) => {
    return get(pathnameOrUrl, {
      access,
      token: token || undefined,
    });
  };

  let result = null;
  let lastError: unknown = null;

  try {
    result = await tryGet(pathname);
  } catch (pathnameErr) {
    lastError = pathnameErr;
    const is403 =
      pathnameErr instanceof Error &&
      (pathnameErr.message.includes('403') || pathnameErr.message.includes('Forbidden'));

    if (is403 && pathname !== url) {
      try {
        result = await tryGet(url);
      } catch (urlErr) {
        lastError = urlErr;
      }
    } else if (!is403) {
      throw pathnameErr;
    }
  }

  if (result) {
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const err = lastError as Error | null;
  const is403 =
    err &&
    err instanceof Error &&
    (err.message.includes('403') || err.message.includes('Forbidden'));

  if (is403) {
    return NextResponse.json(
      {
        error: 'Blob access denied',
        diagnostic: `Store ID in URL: ${storeId}. Verify BLOB_READ_WRITE_TOKEN matches this store in Vercel Dashboard > Storage.`,
      },
      { status: 403 }
    );
  }

  if (lastError) {
    console.error('Image proxy error:', lastError);
  }

  return NextResponse.json(
    { error: lastError ? 'Failed to fetch image' : 'Blob not found' },
    { status: lastError ? 502 : 404 }
  );
}
