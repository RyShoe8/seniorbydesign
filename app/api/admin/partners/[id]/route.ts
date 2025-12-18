import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPartnersCollection } from '@/lib/db';
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
    const collection = await getPartnersCollection();
    
    // Get the current partner to check old order
    const currentPartner = await collection.findOne({ _id: new ObjectId(params.id) });
    if (!currentPartner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    
    const oldOrder = currentPartner.order;
    const newOrder = body.order !== undefined ? parseInt(body.order) : oldOrder;
    
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
      name: body.name || currentPartner.name,
      logo: body.logo || currentPartner.logo,
      displayName: body.displayName !== undefined ? body.displayName : currentPartner.displayName,
      altText: body.altText !== undefined ? body.altText : currentPartner.altText,
      url: body.url !== undefined ? body.url : currentPartner.url,
      order: newOrder,
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { error: 'Failed to update partner' },
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
    const collection = await getPartnersCollection();
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}




