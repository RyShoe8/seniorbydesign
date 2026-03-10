import { NextResponse } from 'next/server';

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

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const headers: HeadersInit = {
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    // For private blobs, include the token for authentication
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      cache: 'force-cache',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const blob = await response.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
