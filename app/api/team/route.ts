import { NextResponse } from 'next/server';
import { getTeamMembersCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const collection = await getTeamMembersCollection();
    const members = await collection.find({}).toArray();
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
