import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaCollection } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Try to import Vercel Blob Storage (optional dependency)
let putBlob: any = null;
try {
  const blobModule = require('@vercel/blob');
  putBlob = blobModule.put;
} catch (e) {
  // @vercel/blob not installed, will use file system
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    let publicUrl: string;

    // Check if we're in a serverless environment
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // Try Vercel Blob Storage first if available and in serverless environment
    if (isServerless && putBlob && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobPath = `images/${folder}/${filename}`;
        const blob = await putBlob(blobPath, buffer, {
          access: 'public',
          contentType: file.type,
        });
        publicUrl = blob.url;
      } catch (blobError: any) {
        console.error('Vercel Blob upload failed:', blobError);
        return NextResponse.json(
          { 
            error: 'Failed to upload to Vercel Blob Storage',
            details: blobError.message,
            code: 'BLOB_UPLOAD_FAILED'
          },
          { status: 500 }
        );
      }
    } else {
      // Try to use local file system (for local development)
      const uploadDir = join(process.cwd(), 'public', 'images', folder);
      
      try {
        // Try to create directory with recursive flag (creates all parent dirs)
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);
        publicUrl = `/images/${folder}/${filename}`;
      } catch (fsError: any) {
        // If file system write fails in serverless environment
        if (isServerless) {
          return NextResponse.json(
            { 
              error: 'File uploads require cloud storage in serverless environments. Please install @vercel/blob and configure BLOB_READ_WRITE_TOKEN environment variable.',
              code: 'SERVERLESS_STORAGE_REQUIRED',
              instructions: '1. Install: npm install @vercel/blob\n2. Set up Blob Storage in Vercel dashboard\n3. Add BLOB_READ_WRITE_TOKEN to environment variables'
            },
            { status: 500 }
          );
        }
        
        // If not serverless but still failed, throw the original error
        throw fsError;
      }
    }
    
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
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
