import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPartnersCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getPartnersCollection();
    const partners = await collection.find({}).toArray();
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
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
    const collection = await getPartnersCollection();
    
    const newOrder = body.order !== undefined ? parseInt(body.order) : 0;
    
    // Shift all partners with order >= newOrder back by 1
    await collection.updateMany(
      { order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );
    
    const partner = {
      name: body.name || '',
      logo: body.logo,
      displayName: body.displayName || '',
      altText: body.altText || '',
      url: body.url || '',
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(partner);
    return NextResponse.json({ _id: result.insertedId, ...partner });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}




