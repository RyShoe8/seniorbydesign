import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsersCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Enhanced authentication - admin role required (stricter than other routes)
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ObjectId validation
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();
    
    // Check if user exists
    const user = await usersCollection.findOne({ _id: new ObjectId(params.id) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent self-deletion (critical safety feature)
    if (user.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    // Delete the user
    await usersCollection.deleteOne({ _id: new ObjectId(params.id) });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}