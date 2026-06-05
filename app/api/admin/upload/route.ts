import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaCollection } from '@/lib/db';
import {
  altFromUploadFields,
  buildSeoImageFilename,
  defaultSpaceTypeForFolder,
} from '@/lib/image-seo';
import crypto from 'crypto';

let putBlob: ((path: string, body: Buffer, options: { access: string; contentType: string }) => Promise<{ url: string }>) | null = null;
try {
  const blobModule = require('@vercel/blob');
  putBlob = blobModule.put;
} catch {
  // @vercel/blob not installed
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!putBlob) {
    return NextResponse.json(
      {
        error: 'Vercel Blob Storage is not configured. Please install @vercel/blob package.',
        code: 'BLOB_NOT_CONFIGURED',
        instructions: 'Run: npm install @vercel/blob',
      },
      { status: 500 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          'BLOB_READ_WRITE_TOKEN environment variable is not set. Please configure Vercel Blob Storage in your Vercel dashboard.',
        code: 'BLOB_TOKEN_MISSING',
        instructions:
          '1. Go to Vercel dashboard → Storage → Create Blob store\n2. Add BLOB_READ_WRITE_TOKEN to environment variables',
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'services';
    const spaceTypeField = formData.get('spaceType') as string | null;
    const projectSlug = (formData.get('projectSlug') as string) || undefined;
    const altDescription = (formData.get('altDescription') as string) || undefined;
    const altTextField = (formData.get('altText') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg';
    const spaceType = defaultSpaceTypeForFolder(folder, spaceTypeField ?? undefined);
    const uniqueToken = crypto.randomBytes(2).toString('hex');
    const filename = buildSeoImageFilename({
      spaceType,
      projectSlug,
      ext,
      uniqueToken,
    });

    const blobPath = `images/${folder}/${filename}`;
    const blob = await putBlob(blobPath, buffer, {
      access: 'public',
      contentType: file.type,
    });

    const publicUrl = blob.url;
    const altText =
      (altTextField ?? '').trim() ||
      altFromUploadFields(altDescription, spaceType, projectSlug);

    try {
      const mediaCollection = await getMediaCollection();
      const displayName = filename.replace(/\.[^/.]+$/, '');
      await mediaCollection.insertOne({
        filePath: publicUrl,
        displayName,
        altText,
        folder: `images/${folder}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {
      // Don't fail the upload if media collection update fails
    }

    return NextResponse.json({ url: publicUrl, altText, filename });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    let errorMessage = 'Failed to upload file';
    let errorDetails = err.message || 'Unknown error';

    if (err.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'Vercel Blob Storage token is missing or invalid';
      errorDetails =
        'Please configure BLOB_READ_WRITE_TOKEN in your Vercel environment variables';
    } else if (err.message?.includes('Cannot find module')) {
      errorMessage = 'Vercel Blob Storage package not installed';
      errorDetails = 'Please install @vercel/blob package: npm install @vercel/blob';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: err.code || 'UPLOAD_ERROR',
      },
      { status: 500 }
    );
  }
}
