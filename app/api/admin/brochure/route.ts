import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBrochureSettingsCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getBrochureSettingsCollection();
    const settings = await collection.findOne({});
    
    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        allowMailRequests: true,
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching brochure settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brochure settings' },
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
    const collection = await getBrochureSettingsCollection();
    
    const settings = {
      allowMailRequests: body.allowMailRequests ?? true,
      updatedAt: new Date(),
    };

    const existing = await collection.findOne({});
    
    if (existing) {
      await collection.updateOne({ _id: existing._id }, { $set: settings });
      return NextResponse.json({ success: true, ...settings });
    } else {
      const result = await collection.insertOne(settings);
      return NextResponse.json({ _id: result.insertedId, ...settings });
    }
  } catch (error) {
    console.error('Error saving brochure settings:', error);
    return NextResponse.json(
      { error: 'Failed to save brochure settings' },
      { status: 500 }
    );
  }
}
