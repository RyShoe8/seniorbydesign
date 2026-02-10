// Brevo API integration using REST API directly (no SDK to avoid Next.js build issues)

function getBrevoApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is not set');
  }
  return apiKey;
}

export interface NewsletterSignupData {
  firstName?: string;
  lastName?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  newsletter?: boolean;
  brochureType?: 'digital' | 'physical';
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  zip?: string;
  message: string;
}

/**
 * Add or update a contact in Brevo using REST API
 */
export async function addContactToBrevo(data: NewsletterSignupData): Promise<void> {
  try {
    const apiKey = getBrevoApiKey();
    
    // Prepare contact attributes
    const attributes: { [key: string]: any } = {};
    
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    if (data.lastName) attributes.LASTNAME = data.lastName;
    if (data.address) attributes.STREET_ADDRESS = data.address;
    if (data.city) attributes.CITY = data.city;
    if (data.state) {
      attributes.STATE = data.state;
      attributes.COUNTRY = 'United States';
    }
    // Only include zip code for physical brochure requests
    if (data.zip && data.brochureType === 'physical') {
      attributes.ZIP_CODE = data.zip;
    }
    if (data.website) attributes.WEB_PAGE = data.website;
    if (data.brochureType) attributes.BROCHURE_TYPE = data.brochureType;
    
    // Set DATE_ADDED in DD-MM-YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    attributes.DATE_ADDED = `${day}-${month}-${year}`;
    
    // Prepare request body
    const requestBody: any = {
      email: data.email,
      attributes: attributes,
      updateEnabled: true,
    };
    
    // Set email blacklist status based on newsletter opt-in
    // If newsletter is not explicitly true, blacklist them from email communications
    requestBody.emailBlacklisted = data.newsletter !== true;
    
    // Handle newsletter subscription and brochure list
    const listIds: number[] = [];
    
    // Add to newsletter list if subscribed
    if (data.newsletter === true) {
      const newsletterListId = process.env.BREVO_LIST_ID;
      if (newsletterListId) {
        listIds.push(parseInt(newsletterListId));
      }
    }
    
    // Add to brochure list (list 5) if requesting a brochure
    if (data.brochureType === 'digital' || data.brochureType === 'physical') {
      const brochureListId = process.env.BREVO_BROCHURE_LIST_ID || '5';
      listIds.push(parseInt(brochureListId));
    }
    
    if (listIds.length > 0) {
      requestBody.listIds = listIds;
    }
    // Note: If newsletter is false, we'll remove from list separately after creating/updating contact
    
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If contact already exists, that's okay (updateEnabled handles it)
      if (errorData.code !== 'duplicate_parameter') {
                throw new Error(errorData.message || 'Failed to add contact to Brevo');
      }
    }
    
    // If newsletter is explicitly false or undefined, remove contact from newsletter list
    if (data.newsletter !== true) {
      const newsletterListId = process.env.BREVO_LIST_ID;
      if (newsletterListId) {
        try {
          const removeResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${newsletterListId}/contacts/remove`, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': apiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              emails: [data.email],
            }),
          });
          
          // Don't throw error if removal fails - contact might not be in list
          if (!removeResponse.ok) {
            const removeError = await removeResponse.json().catch(() => ({}));
            // Log but don't fail - contact might not exist in list
            console.log('Note: Could not remove contact from newsletter list:', removeError);
          }
        } catch (removeError) {
          // Log but don't fail the entire operation
          console.log('Note: Error removing contact from newsletter list:', removeError);
        }
      }
    }
  } catch (error: any) {
        throw error;
  }
}

export interface EmailAttachment {
  name: string;
  content: string; // base64 encoded
}

/**
 * Send transactional email via Brevo REST API
 */
export async function sendTransactionalEmail(
  to: { email: string; name?: string }[],
  subject: string,
  htmlContent: string,
  textContent?: string,
  attachments?: EmailAttachment[]
): Promise<void> {
  try {
    const apiKey = getBrevoApiKey();
    
    // Set sender email
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@seniorbydesign.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Senior By Design';
    
    const requestBody: any = {
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: to,
      subject: subject,
      htmlContent: htmlContent,
    };
    
    if (textContent) {
      requestBody.textContent = textContent;
    }
    
    if (attachments && attachments.length > 0) {
      requestBody.attachment = attachments;
    }
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to send email');
    }
  } catch (error) {
        throw error;
  }
}

/**
 * Add contact form submission to Brevo as a contact
 */
export async function addContactFormToBrevo(data: ContactFormData): Promise<void> {
  try {
    const apiKey = getBrevoApiKey();
    
    // Split name into first and last name if possible
    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Prepare contact attributes
    const attributes: { [key: string]: any } = {};
    
    if (firstName) attributes.FIRSTNAME = firstName;
    if (lastName) attributes.LASTNAME = lastName;
    if (data.phone) {
      attributes.SMS = data.phone; // Standard Brevo phone field
      attributes.LANDLINE_NUMBER = data.phone; // Landline number field
    }
    if (data.website) attributes.WEB_PAGE = data.website;
    if (data.zip) attributes.ZIP_CODE = data.zip;
    // Store the message in a custom attribute
    attributes.MESSAGE = data.message;
    attributes.CONTACT_FORM_SUBMISSION = 'true';
    attributes.SUBMISSION_DATE = new Date().toISOString();
    
    // Set DATE_ADDED in DD-MM-YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    attributes.DATE_ADDED = `${day}-${month}-${year}`;
    
    // Prepare request body
    const requestBody: any = {
      email: data.email,
      attributes: attributes,
      updateEnabled: true,
    };
    
    // Optionally add to a contact form list if specified
    const contactFormListId = process.env.BREVO_CONTACT_FORM_LIST_ID;
    if (contactFormListId) {
      requestBody.listIds = [parseInt(contactFormListId)];
    }
    
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If contact already exists, that's okay (updateEnabled handles it)
      if (errorData.code !== 'duplicate_parameter') {
                throw new Error(errorData.message || 'Failed to add contact form to Brevo');
      }
    }
  } catch (error: any) {
        throw error;
  }
}

/**
 * Send contact form email notification (deprecated - use addContactFormToBrevo instead)
 */
export async function sendContactFormNotification(data: ContactFormData): Promise<void> {
  const adminEmail = process.env.BREVO_ADMIN_EMAIL || 'info@seniorbydesign.com';
  
  const htmlContent = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br>')}</p>
  `;
  
  const textContent = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}

Message:
${data.message}
  `;
  
  await sendTransactionalEmail(
    [{ email: adminEmail, name: 'Senior By Design' }],
    'New Contact Form Submission',
    htmlContent,
    textContent
  );
}
