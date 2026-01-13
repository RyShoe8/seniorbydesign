import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
let apiInstance: brevo.ContactsApi | null = null;
let transactionalApiInstance: brevo.TransactionalEmailsApi | null = null;

function getBrevoApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getContactsApi(): brevo.ContactsApi {
  if (!apiInstance) {
    const apiKey = getBrevoApiKey();
    apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey);
  }
  return apiInstance;
}

function getTransactionalApi(): brevo.TransactionalEmailsApi {
  if (!transactionalApiInstance) {
    const apiKey = getBrevoApiKey();
    transactionalApiInstance = new brevo.TransactionalEmailsApi();
    transactionalApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  return transactionalApiInstance;
}

export interface NewsletterSignupData {
  firstName?: string;
  lastName?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  newsletter?: boolean;
  brochureType?: 'digital' | 'physical';
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

/**
 * Add or update a contact in Brevo
 */
export async function addContactToBrevo(data: NewsletterSignupData): Promise<void> {
  try {
    const apiInstance = getContactsApi();
    
    // Prepare contact attributes
    const attributes: { [key: string]: any } = {};
    
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    if (data.lastName) attributes.LASTNAME = data.lastName;
    if (data.address) attributes.ADDRESS = data.address;
    if (data.city) attributes.CITY = data.city;
    if (data.state) attributes.STATE = data.state;
    if (data.zip) attributes.ZIP = data.zip;
    if (data.brochureType) attributes.BROCHURE_TYPE = data.brochureType;
    
    // Create contact request
    const createContact = new brevo.CreateContact();
    createContact.email = data.email;
    createContact.attributes = attributes;
    
    // Subscribe to newsletter if requested
    // List ID: You'll need to set this in your Brevo account and update the environment variable
    const listIds = process.env.BREVO_LIST_ID ? [parseInt(process.env.BREVO_LIST_ID)] : [];
    if (data.newsletter !== false && listIds.length > 0) {
      createContact.listIds = listIds;
    }
    
    // Update existing contact or create new one
    createContact.updateEnabled = true;
    
    await apiInstance.createContact(createContact);
  } catch (error: any) {
    // If contact already exists, that's okay (updateEnabled handles it)
    if (error?.response?.body?.code !== 'duplicate_parameter') {
      console.error('Error adding contact to Brevo:', error);
      throw error;
    }
  }
}

/**
 * Send transactional email via Brevo
 */
export async function sendTransactionalEmail(
  to: { email: string; name?: string }[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> {
  try {
    const apiInstance = getTransactionalApi();
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = to;
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }
    
    // Set sender email (you may want to make this configurable)
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@seniorbydesign.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Senior By Design';
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    console.error('Error sending transactional email:', error);
    throw error;
  }
}

/**
 * Add contact form submission to Brevo as a contact
 */
export async function addContactFormToBrevo(data: ContactFormData): Promise<void> {
  try {
    const apiInstance = getContactsApi();
    
    // Split name into first and last name if possible
    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Prepare contact attributes
    const attributes: { [key: string]: any } = {};
    
    if (firstName) attributes.FIRSTNAME = firstName;
    if (lastName) attributes.LASTNAME = lastName;
    if (data.phone) attributes.PHONE = data.phone;
    // Store the message in a custom attribute
    attributes.MESSAGE = data.message;
    attributes.CONTACT_FORM_SUBMISSION = 'true';
    attributes.SUBMISSION_DATE = new Date().toISOString();
    
    // Create contact request
    const createContact = new brevo.CreateContact();
    createContact.email = data.email;
    createContact.attributes = attributes;
    
    // Optionally add to a contact form list if specified
    const contactFormListId = process.env.BREVO_CONTACT_FORM_LIST_ID;
    if (contactFormListId) {
      createContact.listIds = [parseInt(contactFormListId)];
    }
    
    // Update existing contact or create new one
    createContact.updateEnabled = true;
    
    await apiInstance.createContact(createContact);
  } catch (error: any) {
    // If contact already exists, that's okay (updateEnabled handles it)
    if (error?.response?.body?.code !== 'duplicate_parameter') {
      console.error('Error adding contact form to Brevo:', error);
      throw error;
    }
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
