import { NextResponse } from 'next/server';
import { addContactToBrevo, sendTransactionalEmail, NewsletterSignupData } from '@/lib/brevo';
import { getBrochureRequestsCollection } from '@/lib/db';
import { verifyRecaptchaV3 } from '@/lib/recaptcha';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: NewsletterSignupData & { recaptchaToken?: string } = await request.json();

    const recaptchaOk = await verifyRecaptchaV3(
      body.recaptchaToken,
      'newsletter',
      request
    );
    if (!recaptchaOk) {
      return NextResponse.json(
        { error: 'Unable to verify submission. Please try again.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Add contact to Brevo
    await addContactToBrevo(body);

    // Track brochure request type (no PII)
    if (body.brochureType === 'digital' || body.brochureType === 'physical') {
      const requestsCollection = await getBrochureRequestsCollection();
      await requestsCollection.insertOne({
        brochureType: body.brochureType,
        createdAt: new Date(),
      });
    }
    
    // Send confirmation email if brochure type is digital
    if (body.brochureType === 'digital') {
      try {
        // Get base URL - prioritize production domain for email reliability
        // Always use production domain for emails to ensure images load
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seniorbydesign.com';
        
        // If NEXT_PUBLIC_BASE_URL is not set, try to get from request but fallback to production
        if (!process.env.NEXT_PUBLIC_BASE_URL) {
          const origin = request.headers.get('origin');
          const host = request.headers.get('host');
          
          // Only use request origin/host if it's the production domain
          if (origin && origin.includes('seniorbydesign.com')) {
            baseUrl = origin;
          } else if (host && host.includes('seniorbydesign.com')) {
            baseUrl = `https://${host}`;
          } else {
            // Default to production domain for email reliability
            baseUrl = 'https://seniorbydesign.com';
          }
        }
        
        // Ensure baseUrl doesn't have trailing slash and is HTTPS
        baseUrl = baseUrl.replace(/\/$/, '').replace(/^http:/, 'https:');
        
        // Construct logo URL - encode spaces properly for email clients
        // Email clients prefer %20 over + for spaces
        const logoFileName = 'SBD Logo.webp';
        const logoUrl = `${baseUrl}/images/${logoFileName.replace(/ /g, '%20')}`;
        
        // Log for debugging (remove in production if needed)
        console.log('Email logo URL:', logoUrl);
        
        // Construct brochure download URL - encode spaces in filename
        const brochureFileName = 'SBD Interactive Brochure.pdf';
        let brochureUrl = process.env.NEXT_PUBLIC_BROCHURE_DOWNLOAD_URL;
        
        if (!brochureUrl) {
          // Construct URL if env var not set
          brochureUrl = `${baseUrl}/files/${brochureFileName.replace(/ /g, '%20')}`;
        } else {
          // If env var is set but contains unencoded spaces, encode them
          brochureUrl = brochureUrl.replace(/ /g, '%20');
        }
        
        const confirmationSubject = 'Welcome to Senior By Design - Your Digital Brochure';
        const confirmationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${logoUrl}" alt="Senior By Design" width="200" style="max-width: 200px; height: auto; display: block; margin: 0 auto; border: 0;" />
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





