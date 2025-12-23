import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHomepageContentCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getHomepageContentCollection();
    
    const existing = await collection.findOne({});
    
    const testimonial = {
      review: body.review,
      name: body.name,
      position: body.position,
      company: body.company,
    };

    if (existing) {
      const testimonials = existing.testimonials || [];
      testimonials.push(testimonial);
      await collection.updateOne(
        { _id: existing._id },
        { $set: { testimonials, updatedAt: new Date() } }
      );
    } else {
      await collection.insertOne({
        heroHeadline: '',
        heroSubheadline: '',
        heroVideo: '',
        portfolioHighlights: [],
        testimonials: [testimonial],
        partners: [],
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await getHomepageContentCollection();
    
    const existing = await collection.findOne({});
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Homepage content not found' },
        { status: 404 }
      );
    }

    const testimonials = existing.testimonials || [];
    const index = body.index;
    
    if (index < 0 || index >= testimonials.length) {
      return NextResponse.json(
        { error: 'Invalid testimonial index' },
        { status: 400 }
      );
    }

    testimonials[index] = {
      review: body.review,
      name: body.name,
      position: body.position,
      company: body.company,
    };

    await collection.updateOne(
      { _id: existing._id },
      { $set: { testimonials, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index') || '');
    
    if (isNaN(index)) {
      return NextResponse.json(
        { error: 'Invalid index parameter' },
        { status: 400 }
      );
    }

    const collection = await getHomepageContentCollection();
    const existing = await collection.findOne({});
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Homepage content not found' },
        { status: 404 }
      );
    }

    const testimonials = existing.testimonials || [];
    
    if (index < 0 || index >= testimonials.length) {
      return NextResponse.json(
        { error: 'Invalid testimonial index' },
        { status: 400 }
      );
    }

    testimonials.splice(index, 1);

    await collection.updateOne(
      { _id: existing._id },
      { $set: { testimonials, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}


