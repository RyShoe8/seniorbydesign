import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMediaCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getMediaCollection();
    const mediaItems = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Also scan for images that aren't in the database yet
    const imagesDir = join(process.cwd(), 'public', 'images');
    const allFiles: string[] = [];
    
    if (existsSync(imagesDir)) {
      await scanDirectory(imagesDir, 'images', allFiles);
    }
    
    // Create a map of existing media items by filePath
    const existingPaths = new Set(mediaItems.map(item => item.filePath));
    
    // Add any files that aren't in the database
    const newFiles = allFiles.filter(file => !existingPaths.has(file));
    const newMediaItems = newFiles.map(filePath => ({
      filePath,
      displayName: filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || filePath,
      altText: '',
      folder: filePath.split('/').slice(0, -1).join('/'),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    if (newMediaItems.length > 0) {
      await collection.insertMany(newMediaItems);
    }
    
    // Return all media items
    const allMediaItems = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(allMediaItems);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

async function scanDirectory(dir: string, basePath: string, files: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip .git directories
        if (entry.name.startsWith('.')) continue;
        await scanDirectory(fullPath, `${basePath}/${entry.name}`, files);
      } else if (entry.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
        const relativePath = `/${basePath}/${entry.name}`;
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getMediaCollection();
    
    const update = {
      displayName: body.displayName,
      altText: body.altText,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(body._id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}
