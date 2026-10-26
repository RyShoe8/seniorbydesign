import { NextResponse } from 'next/server';
import { getStaffSession } from '@/lib/portal/server';
import { getResourcesCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getStaffSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getResourcesCollection();
    const resources = await collection.find({}).toArray();
    return NextResponse.json(resources);
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getStaffSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getResourcesCollection();
    
    const resource = {
      name: body.name,
      link: body.link,
      note: body.note || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(resource);
    return NextResponse.json({ _id: result.insertedId, ...resource });
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}





