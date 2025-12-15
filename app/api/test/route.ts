import { NextResponse } from 'next/server';
import getClientPromise from '@/lib/mongodb';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientPromise = getClientPromise();
    const client = await clientPromise;
    const db = client.db();
    
    // Test connection
    await db.admin().ping();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'MongoDB connection successful' 
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to MongoDB' },
      { status: 500 }
    );
  }
}

