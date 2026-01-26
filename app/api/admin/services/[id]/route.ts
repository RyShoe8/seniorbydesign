import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServicesCollection, getMediaCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getServicesCollection();
    
    // Get the existing service to check for old images
    const existingService = await collection.findOne({ _id: new ObjectId(params.id) });
    const oldHeroImage = existingService?.heroImage;
    const newHeroImage = body.heroImage || '';
    const oldImages = existingService?.images || [];
    const newImages = body.images || [];
    
    // If hero image changed and old one exists, delete it from media library
    if (oldHeroImage && oldHeroImage !== newHeroImage && oldHeroImage.trim() !== '') {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteOne({ filePath: oldHeroImage });
      } catch (error) {
        console.error('Failed to delete old hero image from media library:', error);
      }
    }
    
    // Find images that were removed
    const oldImageSet = new Set(Array.isArray(oldImages) ? oldImages : []);
    const newImageSet = new Set(Array.isArray(newImages) ? newImages : []);
    const removedImages = Array.from(oldImageSet).filter(img => !newImageSet.has(img));
    
    // Delete removed images from media library
    if (removedImages.length > 0) {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteMany({ filePath: { $in: removedImages } });
      } catch (error) {
        console.error('Failed to delete removed images from media library:', error);
      }
    }
    
    const update = {
      slug: body.slug,
      title: body.title,
      heroImage: newHeroImage,
      body: body.body,
      images: newImages,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getServicesCollection();
    
    // Get the service before deleting to remove its images
    const service = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (service) {
      const imagesToDelete: string[] = [];
      
      // Add hero image if it exists
      if (service.heroImage && typeof service.heroImage === 'string' && service.heroImage.trim() !== '') {
        imagesToDelete.push(service.heroImage);
      }
      
      // Add all images from images array
      if (service.images && Array.isArray(service.images)) {
        service.images.forEach(img => {
          if (typeof img === 'string' && img.trim() !== '') {
            imagesToDelete.push(img);
          }
        });
      }
      
      // Delete all images from media library
      if (imagesToDelete.length > 0) {
        try {
          const mediaCollection = await getMediaCollection();
          await mediaCollection.deleteMany({ filePath: { $in: imagesToDelete } });
        } catch (error) {
          console.error('Failed to delete service images from media library:', error);
        }
      }
    }
    
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}





