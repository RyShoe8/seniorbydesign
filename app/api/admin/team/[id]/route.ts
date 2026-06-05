import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamMembersCollection, getMediaCollection } from '@/lib/db';
import { normalizeSlug, slugFromTitle } from '@/lib/slug';
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
    
    // Get the existing team member to check for old image and order
    const existingMember = await collection.findOne({ _id: new ObjectId(params.id) });
    const oldProfileImage = existingMember?.profileImage;
    const newProfileImage = body.profileImage || '';
    const oldOrder = existingMember?.order || 0;
    const newOrder = body.order !== undefined ? parseInt(body.order) : oldOrder;
    
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
    
    // Handle order shifting
    if (newOrder !== oldOrder) {
      if (newOrder > oldOrder) {
        // Moving forward: shift items between oldOrder and newOrder back by 1
        await collection.updateMany(
          { 
            _id: { $ne: new ObjectId(params.id) },
            order: { $gt: oldOrder, $lte: newOrder }
          },
          { $inc: { order: -1 } }
        );
      } else {
        // Moving backward: shift items between newOrder and oldOrder forward by 1
        await collection.updateMany(
          { 
            _id: { $ne: new ObjectId(params.id) },
            order: { $gte: newOrder, $lt: oldOrder }
          },
          { $inc: { order: 1 } }
        );
      }
    }
    
    const slug = normalizeSlug(body.slug || slugFromTitle(body.name || ''));
    
    const update = {
      slug,
      name: body.name,
      title: body.title,
      bio: body.bio,
      profileImage: newProfileImage,
      linkedin: body.linkedin || '',
      facebook: body.facebook || '',
      instagram: body.instagram || '',
      order: newOrder,
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





