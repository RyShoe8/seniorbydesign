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

  try {
    const access = url.includes('.private.blob.vercel-storage.com') ? 'private' : 'public';
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    const result = await get(url, {
      access,
      token: token || undefined,
    });

    if (!result) {
      return NextResponse.json({ error: 'Blob not found' }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 502 }
    );
  }
}
