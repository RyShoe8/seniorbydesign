import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHomepageContentCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getHomepageContentCollection();
    const content = await collection.findOne({});
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage content' },
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
    const collection = await getHomepageContentCollection();
    
    const existing = await collection.findOne({});
    const currentContent = existing || {
      heroHeadline: 'Soul Warming Interiors',
      heroSubheadline: 'From concept to realization we take great pride in designing luxurious, soul-warming interiors distinctly tailored to the unique characteristics of each community we serve.',
      heroVideo: '',
      portfolioHighlights: [],
      testimonials: [],
      partners: [],
    };

    const content = {
      heroHeadline: currentContent.heroHeadline,
      heroSubheadline: currentContent.heroSubheadline,
      heroVideo: currentContent.heroVideo || '',
      portfolioHighlights: body.portfolioHighlights || currentContent.portfolioHighlights || [],
      testimonials: currentContent.testimonials || [],
      partners: currentContent.partners || [],
      updatedAt: new Date(),
    };

    if (existing) {
      await collection.updateOne({ _id: existing._id }, { $set: content });
      return NextResponse.json({ success: true });
    } else {
      const result = await collection.insertOne(content);
      return NextResponse.json({ _id: result.insertedId, ...content });
    }
  } catch (error) {
    console.error('Error saving homepage content:', error);
    return NextResponse.json(
      { error: 'Failed to save homepage content' },
      { status: 500 }
    );
  }
}



