import { NextResponse } from 'next/server';
import { addContactToBrevo, sendTransactionalEmail, NewsletterSignupData } from '@/lib/brevo';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: NewsletterSignupData = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Add contact to Brevo
    await addContactToBrevo(body);
    
    // Send confirmation email if brochure type is digital
    if (body.brochureType === 'digital') {
      try {
        const confirmationSubject = 'Welcome to Senior By Design - Your Digital Brochure';
        const confirmationHtml = `
          <h2>Thank you for subscribing!</h2>
          <p>Dear ${body.firstName || 'Valued Customer'},</p>
          <p>Thank you for joining the Senior By Design family! We're excited to have you with us.</p>
          <p>As requested, here is your digital brochure. You can download it using the link below:</p>
          <p><a href="${process.env.NEXT_PUBLIC_BROCHURE_DOWNLOAD_URL || '#'}" style="background-color: #CBAC6D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Brochure</a></p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The Senior By Design Team</p>
        `;
        
        await sendTransactionalEmail(
          [{ email: body.email, name: body.firstName || '' }],
          confirmationSubject,
          confirmationHtml
        );
      } catch (emailError) {
        // Log but don't fail the request if confirmation email fails
              }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
        // Return appropriate error message
    const errorMessage = error?.message || 'Failed to process signup';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}





