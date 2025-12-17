import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaCollection } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    // Create directory structure if it doesn't exist
    const publicDir = join(process.cwd(), 'public');
    const imagesDir = join(publicDir, 'images');
    const uploadDir = join(imagesDir, folder);
    
    // Ensure all parent directories exist
    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }
    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(uploadDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/images/${folder}/${filename}`;
    
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
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
