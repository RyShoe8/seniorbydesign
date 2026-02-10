/**
 * Email templates for transactional emails
 */

export interface BrochureEmailData {
  recipientName?: string;
  senderName?: string;
  customMessage?: string;
}

/**
 * Generate HTML email template for brochure email
 */
export function generateBrochureEmailTemplate(data: BrochureEmailData): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const recipientName = data.recipientName ? ` ${data.recipientName}` : '';
  const senderName = data.senderName || 'Senior By Design';
  const customMessage = data.customMessage ? `<p style="margin: 20px 0; padding: 15px; background-color: #faf7f2; border-left: 4px solid #CBB86D; border-radius: 4px; color: #593825; font-style: italic;">${data.customMessage.replace(/\n/g, '<br>')}</p>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Senior By Design Brochure</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #593825 0%, #8B6F47 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Cormorant', serif;">Senior By Design</h1>
              <p style="margin: 10px 0 0; color: #CBB86D; font-size: 16px; font-weight: 400;">Soul Warming Interiors</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #593825; font-size: 18px; line-height: 1.6;">
                Dear${recipientName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in Senior By Design. We're delighted to share our interactive brochure with you.
              </p>
              
              ${customMessage}
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Our brochure showcases our approach to designing luxurious, soul-warming interiors for senior living communities. You'll find detailed information about our services, portfolio, and design philosophy.
              </p>
              
              <!-- Download Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <a href="${siteUrl}/files/SBD Interactive Brochure.pdf" 
                       style="display: inline-block; padding: 16px 32px; background-color: #CBB86D; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(203, 172, 109, 0.3);">
                      Download Brochure
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                The brochure is also attached to this email for your convenience. If you have any questions or would like to discuss your project, please don't hesitate to reach out.
              </p>
              
              <p style="margin: 30px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #593825;">${senderName}</strong><br>
                <span style="color: #666666; font-size: 14px;">Senior By Design</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #faf7f2; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; color: #593825; font-size: 16px; font-weight: 600;">Senior By Design</p>
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                (833) 773-3744<br>
                <a href="${siteUrl}" style="color: #CBB86D; text-decoration: none;">${siteUrl}</a>
              </p>
              <p style="margin: 20px 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                This email was sent from Senior By Design. If you have any questions, please contact us at <a href="mailto:info@seniorbydesign.com" style="color: #CBB86D; text-decoration: none;">info@seniorbydesign.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of brochure email
 */
export function generateBrochureEmailText(data: BrochureEmailData): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seniorbydesign.com';
  const recipientName = data.recipientName ? ` ${data.recipientName}` : '';
  const senderName = data.senderName || 'Senior By Design';
  const customMessage = data.customMessage ? `\n\n${data.customMessage}\n` : '';

  return `
Dear${recipientName},

Thank you for your interest in Senior By Design. We're delighted to share our interactive brochure with you.${customMessage}

Our brochure showcases our approach to designing luxurious, soul-warming interiors for senior living communities. You'll find detailed information about our services, portfolio, and design philosophy.

Download the brochure here: ${siteUrl}/files/SBD Interactive Brochure.pdf

The brochure is also attached to this email for your convenience. If you have any questions or would like to discuss your project, please don't hesitate to reach out.

Best regards,
${senderName}
Senior By Design

(833) 773-3744
${siteUrl}

This email was sent from Senior By Design. If you have any questions, please contact us at info@seniorbydesign.com
  `.trim();
}
