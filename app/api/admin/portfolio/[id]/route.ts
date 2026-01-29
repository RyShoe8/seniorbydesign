import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolioCategoriesCollection, getMediaCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const collection = await getPortfolioCategoriesCollection();
    const category = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

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
    const collection = await getPortfolioCategoriesCollection();
    
    // Get the existing category to check for old images and order
    const existingCategory = await collection.findOne({ _id: new ObjectId(params.id) });
    const oldImages = existingCategory?.images || [];
    const newImages = body.images || [];
    const oldOrder = existingCategory?.order || 0;
    const newOrder = body.order !== undefined ? parseInt(body.order) : oldOrder;
    
    // Extract URLs from both old and new images (handle both string[] and PortfolioImage[] formats)
    const getImageUrls = (images: any[]): string[] => {
      return images.map(img => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.url) return img.url;
        return '';
      }).filter(url => url && url.trim() !== '');
    };
    
    const oldImageUrls = new Set(getImageUrls(Array.isArray(oldImages) ? oldImages : []));
    const newImageUrls = new Set(getImageUrls(Array.isArray(newImages) ? newImages : []));
    
    // Find images that were removed
    const removedImageUrls = Array.from(oldImageUrls).filter(url => !newImageUrls.has(url));
    
    // Delete removed images from media library
    if (removedImageUrls.length > 0) {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteMany({ filePath: { $in: removedImageUrls } });
      } catch (error) {
        console.error('Failed to delete removed portfolio images from media library:', error);
      }
    }
    
    // Handle order shifting
    if (newOrder !== oldOrder) {
      if (newOrder > oldOrder) {
        // Moving forward: shift items between oldOrder and newOrder back by 1
        await collection.updateMany(
          { 
            _id: { $ne: new ObjectId(params.id) },
            order: { $gt: oldOrder, $lte: newOrder }
          },
          { $inc: { order: -1 } }
        );
      } else {
        // Moving backward: shift items between newOrder and oldOrder forward by 1
        await collection.updateMany(
          { 
            _id: { $ne: new ObjectId(params.id) },
            order: { $gte: newOrder, $lt: oldOrder }
          },
          { $inc: { order: 1 } }
        );
      }
    }
    
    const update = {
      slug: body.slug,
      name: body.name,
      images: newImages,
      order: newOrder,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    const collection = await getPortfolioCategoriesCollection();
    
    // Get the category before deleting to remove its images
    const category = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (category?.images && Array.isArray(category.images) && category.images.length > 0) {
      // Extract URLs from images (handle both string[] and PortfolioImage[] formats)
      const imageUrls = category.images
        .map(img => {
          if (typeof img === 'string') return img;
          if (typeof img === 'object' && img.url) return img.url;
          return '';
        })
        .filter(url => url && url.trim() !== '');
      
      if (imageUrls.length > 0) {
        try {
          const mediaCollection = await getMediaCollection();
          await mediaCollection.deleteMany({ filePath: { $in: imageUrls } });
        } catch (error) {
          console.error('Failed to delete portfolio images from media library:', error);
        }
      }
    }
    
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}





