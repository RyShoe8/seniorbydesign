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
        // Get base URL from request or use environment variable
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
                       origin || (host ? `https://${host}` : 'https://seniorbydesign.com');
        const logoUrl = `${baseUrl}/images/SBD Logo.webp`;
        
        // Construct brochure download URL - encode spaces in filename
        const brochureFileName = 'SBD Interactive Brochure.pdf';
        const brochureUrl = process.env.NEXT_PUBLIC_BROCHURE_DOWNLOAD_URL || 
                          `${baseUrl}/files/${encodeURIComponent(brochureFileName)}`;
        
        const confirmationSubject = 'Welcome to Senior By Design - Your Digital Brochure';
        const confirmationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Senior By Design" style="max-width: 200px; height: auto;" />
            </div>
            <h2 style="color: #593825; margin-top: 0;">Thank you for subscribing!</h2>
            <p>Dear ${body.firstName || 'Valued Customer'},</p>
            <p>Thank you for joining the Senior By Design family! We're excited to have you with us.</p>
            <p>As requested, here is your digital brochure. You can download it using the link below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${brochureUrl}" style="background-color: #CBAC6D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Download Brochure</a>
            </p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Senior By Design Team</p>
          </div>
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





