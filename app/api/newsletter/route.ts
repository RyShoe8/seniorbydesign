import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Here you would integrate with Brevo for email/address capture
    // For now, just log the data
    console.log('Newsletter signup:', body);
    
    // TODO: Add to Brevo contact list
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}




