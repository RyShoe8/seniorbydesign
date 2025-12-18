import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaCollection } from '@/lib/db';

// Import Vercel Blob Storage
let putBlob: any = null;
try {
  const blobModule = require('@vercel/blob');
  putBlob = blobModule.put;
} catch (e) {
  // @vercel/blob not installed
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Vercel Blob Storage is configured
  if (!putBlob) {
    return NextResponse.json(
      { 
        error: 'Vercel Blob Storage is not configured. Please install @vercel/blob package.',
        code: 'BLOB_NOT_CONFIGURED',
        instructions: 'Run: npm install @vercel/blob'
      },
      { status: 500 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { 
        error: 'BLOB_READ_WRITE_TOKEN environment variable is not set. Please configure Vercel Blob Storage in your Vercel dashboard.',
        code: 'BLOB_TOKEN_MISSING',
        instructions: '1. Go to Vercel dashboard → Storage → Create Blob store\n2. Add BLOB_READ_WRITE_TOKEN to environment variables'
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'services';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;

    // Upload to Vercel Blob Storage
    const blobPath = `images/${folder}/${filename}`;
    const blob = await putBlob(blobPath, buffer, {
      access: 'public',
      contentType: file.type,
    });
    
    const publicUrl = blob.url;
    
    // Add to media collection
    try {
      const mediaCollection = await getMediaCollection();
      const displayName = originalName.replace(/\.[^/.]+$/, '');
      await mediaCollection.insertOne({
        filePath: publicUrl,
        displayName: displayName,
        altText: '',
        folder: `images/${folder}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding to media collection:', error);
      // Don't fail the upload if media collection update fails
    }
    
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    let errorDetails = error.message || 'Unknown error';
    
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'Vercel Blob Storage token is missing or invalid';
      errorDetails = 'Please configure BLOB_READ_WRITE_TOKEN in your Vercel environment variables';
    } else if (error.message?.includes('Cannot find module')) {
      errorMessage = 'Vercel Blob Storage package not installed';
      errorDetails = 'Please install @vercel/blob package: npm install @vercel/blob';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: error.code || 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
}

