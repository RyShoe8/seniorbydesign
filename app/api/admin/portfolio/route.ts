import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolioCategoriesCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getPortfolioCategoriesCollection();
    const categories = await collection.find({}).toArray();
    return NextResponse.json(categories);
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getPortfolioCategoriesCollection();
    
    // Handle migration for existing records without order field
    const existingCategories = await collection.find({ order: { $exists: false } }).toArray();
    if (existingCategories.length > 0) {
      existingCategories.forEach(async (cat, index) => {
        await collection.updateOne(
          { _id: cat._id },
          { $set: { order: index + 1 } }
        );
      });
    }
    
    const newOrder = body.order !== undefined ? parseInt(body.order) : 0;
    
    // Shift all categories with order >= newOrder back by 1
    await collection.updateMany(
      { order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );
    
    const category = {
      slug: body.slug,
      name: body.name,
      images: body.images || [],
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(category);
    return NextResponse.json({ _id: result.insertedId, ...category });
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}





