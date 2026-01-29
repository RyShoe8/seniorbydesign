import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamMembersCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const collection = await getTeamMembersCollection();
    const members = await collection.find({}).toArray();
    return NextResponse.json(members);
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to fetch team members' },
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
    const collection = await getTeamMembersCollection();
    
    // Handle migration for existing records without order field
    const existingMembers = await collection.find({ order: { $exists: false } }).toArray();
    if (existingMembers.length > 0) {
      existingMembers.forEach(async (member, index) => {
        await collection.updateOne(
          { _id: member._id },
          { $set: { order: index + 1 } }
        );
      });
    }
    
    const newOrder = body.order !== undefined ? parseInt(body.order) : 0;
    
    // Shift all members with order >= newOrder back by 1
    await collection.updateMany(
      { order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );
    
    const member = {
      slug: body.slug,
      name: body.name,
      title: body.title,
      bio: body.bio,
      profileImage: body.profileImage || '',
      linkedin: body.linkedin || '',
      facebook: body.facebook || '',
      instagram: body.instagram || '',
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(member);
    return NextResponse.json({ _id: result.insertedId, ...member });
  } catch (error) {
        return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}





