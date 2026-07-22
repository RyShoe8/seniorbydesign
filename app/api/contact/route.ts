import { NextResponse } from 'next/server';
import { addContactFormToBrevo, sendContactFormNotification, ContactFormData } from '@/lib/brevo';
import { verifyRecaptchaV3 } from '@/lib/recaptcha';

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
  recaptchaToken?: string;
}

export async function POST(request: Request) {
  try {
    const body: ContactFormRequestBody = await request.json();

    const recaptchaOk = await verifyRecaptchaV3(
      body.recaptchaToken,
      'contact',
      request
    );
    if (!recaptchaOk) {
      return NextResponse.json(
        { error: 'Unable to verify submission. Please try again.' },
        { status: 403 }
      );
    }

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
    
    // 1. Add contact form submission & attributes to Brevo contacts database
    await addContactFormToBrevo(contactData).catch((err) =>
      console.error('Brevo add contact warning:', err)
    );

    // 2. Send instant email notification to Senior By Design team
    await sendContactFormNotification(contactData).catch((err) =>
      console.error('Brevo notification email warning:', err)
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to submit contact form';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}





