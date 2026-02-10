import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTransactionalEmail, EmailAttachment } from '@/lib/brevo';
import { generateBrochureEmailTemplate, generateBrochureEmailText } from '@/lib/email-templates';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, name, message } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Get sender name from session or use default
    const senderName = session.user?.name || session.user?.email?.split('@')[0] || 'Senior By Design';

    // Generate email content
    const htmlContent = generateBrochureEmailTemplate({
      recipientName: name,
      senderName: senderName,
      customMessage: message,
    });

    const textContent = generateBrochureEmailText({
      recipientName: name,
      senderName: senderName,
      customMessage: message,
    });

    // Read PDF file and convert to base64
    let attachment: EmailAttachment | undefined;
    try {
      const pdfPath = join(process.cwd(), 'public', 'files', 'SBD Interactive Brochure.pdf');
      const pdfBuffer = await readFile(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      attachment = {
        name: 'SBD Interactive Brochure.pdf',
        content: pdfBase64,
      };
    } catch (pdfError) {
      // Log error but don't fail - email will still be sent without attachment
      console.error('Failed to attach PDF:', pdfError);
    }

    // Send email
    await sendTransactionalEmail(
      [{ email, name: name || undefined }],
      'Senior By Design - Interactive Brochure',
      htmlContent,
      textContent,
      attachment ? [attachment] : undefined
    );

    return NextResponse.json({ success: true, message: 'Brochure sent successfully' });
  } catch (error: any) {
    console.error('Error sending brochure email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send brochure email' },
      { status: 500 }
    );
  }
}
