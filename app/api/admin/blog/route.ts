import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBlogPostsCollection } from '@/lib/db';
import { generateBlogPreviewToken } from '@/lib/blog-preview';
import { revalidateBlogPublicRoutes } from '@/lib/blog-revalidate';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getBlogPostsCollection();
    const posts = await collection.find({}).sort({ publishedAt: -1, createdAt: -1 }).toArray();
    for (const p of posts) {
      if (!p.previewToken && p._id) {
        const previewToken = generateBlogPreviewToken();
        await collection.updateOne({ _id: p._id }, { $set: { previewToken } });
        p.previewToken = previewToken;
      }
    }
    return NextResponse.json(posts);
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
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
    const collection = await getBlogPostsCollection();
    
    // Generate slug from title if not provided
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const post = {
      slug,
      title: body.title,
      excerpt: body.excerpt || '',
      body: body.body,
      featuredImage: body.featuredImage || '',
      author: body.author || session.user?.email || 'Admin',
      publishedAt: body.published ? new Date() : undefined,
      previewToken: generateBlogPreviewToken(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(post);
    revalidateBlogPublicRoutes({ slug: post.slug });
    return NextResponse.json({ _id: result.insertedId, ...post });
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
