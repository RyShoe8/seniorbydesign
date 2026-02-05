import { NextResponse } from 'next/server';
import { addContactFormToBrevo, ContactFormData } from '@/lib/brevo';

export const dynamic = 'force-dynamic';

interface ContactFormRequestBody {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  company?: string;
  zip?: string;
  website?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactFormRequestBody = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'First name, last name, email, and message are required' },
        { status: 400 }
      );
    }
    
    // Combine firstName and lastName into name for Brevo
    const contactData: ContactFormData = {
      name: `${body.firstName} ${body.lastName}`.trim(),
      email: body.email,
      phone: body.phone,
      zip: body.zip,
      website: body.website,
      message: body.message,
    };
    
    // Add contact form submission to Brevo inbox
    await addContactFormToBrevo(contactData);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
        const errorMessage = error?.message || 'Failed to submit contact form';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}





