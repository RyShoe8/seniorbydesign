import { NextResponse } from 'next/server';
import { addContactFormToBrevo, ContactFormData } from '@/lib/brevo';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: ContactFormData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    
    // Add contact form submission to Brevo inbox
    await addContactFormToBrevo(body);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact form error:', error);
    
    const errorMessage = error?.message || 'Failed to submit contact form';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}





