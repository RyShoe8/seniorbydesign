import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDesignGuideContentCollection } from '@/lib/db';

/**
 * GET /api/admin/design-guide
 * Returns the design guide content document (public read for the experience page).
 */
export async function GET() {
  try {
    const col = await getDesignGuideContentCollection();
    const doc = await col.findOne({});
    if (!doc) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching design guide content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/design-guide
 * Upserts the entire design guide content (admin-only).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const col = await getDesignGuideContentCollection();

    // Remove _id from body if present to avoid immutable field error
    const { _id, ...updateData } = body;

    const result = await col.updateOne(
      {},
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, modified: result.modifiedCount });
  } catch (error) {
    console.error('Error saving design guide content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
