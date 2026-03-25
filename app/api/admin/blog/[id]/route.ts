import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBlogPostsCollection, getMediaCollection } from '@/lib/db';
import { generateBlogPreviewToken } from '@/lib/blog-preview';
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
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const collection = await getBlogPostsCollection();
    const post = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
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
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const collection = await getBlogPostsCollection();
    
    // Get the existing blog post to check for old image
    const existingPost = await collection.findOne({ _id: new ObjectId(params.id) });
    const oldFeaturedImage = existingPost?.featuredImage;
    const newFeaturedImage = body.featuredImage || '';
    
    // If featured image changed and old one exists, delete it from media library
    if (oldFeaturedImage && oldFeaturedImage !== newFeaturedImage && oldFeaturedImage.trim() !== '') {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteOne({ filePath: oldFeaturedImage });
      } catch (error) {
        console.error('Failed to delete old featured image from media library:', error);
      }
    }
    
    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const update: any = {
      slug,
      title: body.title,
      excerpt: body.excerpt || '',
      body: body.body,
      featuredImage: newFeaturedImage,
      author: body.author || session.user?.email || 'Admin',
      updatedAt: new Date(),
    };

    // Handle publish/unpublish
    if (body.published) {
      // If publishing, set publishedAt (or update it if already published)
      update.publishedAt = new Date();
    } else {
      // If unpublishing, remove publishedAt
      update.publishedAt = undefined;
    }

    update.previewToken = existingPost?.previewToken ?? generateBlogPreviewToken();

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
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
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const collection = await getBlogPostsCollection();
    
    // Get the blog post before deleting to remove its featured image
    const post = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (post?.featuredImage && post.featuredImage.trim() !== '') {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteOne({ filePath: post.featuredImage });
      } catch (error) {
        console.error('Failed to delete featured image from media library:', error);
      }
    }
    
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
