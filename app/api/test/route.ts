import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
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

