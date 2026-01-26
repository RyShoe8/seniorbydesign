import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamMembersCollection, getMediaCollection } from '@/lib/db';
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
    const collection = await getTeamMembersCollection();
    
    // Get the existing team member to check for old image
    const existingMember = await collection.findOne({ _id: new ObjectId(params.id) });
    const oldProfileImage = existingMember?.profileImage;
    const newProfileImage = body.profileImage || '';
    
    // If profile image changed and old one exists, delete it from media library
    if (oldProfileImage && oldProfileImage !== newProfileImage && oldProfileImage.trim() !== '') {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteOne({ filePath: oldProfileImage });
      } catch (error) {
        // Don't fail the update if media deletion fails
        console.error('Failed to delete old profile image from media library:', error);
      }
    }
    
    const update = {
      slug: body.slug,
      name: body.name,
      title: body.title,
      bio: body.bio,
      profileImage: newProfileImage,
      linkedin: body.linkedin || '',
      facebook: body.facebook || '',
      instagram: body.instagram || '',
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: update }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
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
    const collection = await getTeamMembersCollection();
    
    // Get the team member before deleting to remove their profile image
    const member = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (member?.profileImage && member.profileImage.trim() !== '') {
      try {
        const mediaCollection = await getMediaCollection();
        await mediaCollection.deleteOne({ filePath: member.profileImage });
      } catch (error) {
        console.error('Failed to delete profile image from media library:', error);
      }
    }
    
    await collection.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}





