# Brevo Integration Setup

This document explains how to set up the Brevo (formerly Sendinblue) integration for newsletter subscriptions and contact form emails.

## Installation

First, install the Brevo SDK package:

```bash
npm install @getbrevo/brevo
```

## Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment platform's environment variables):

### Required Variables

- **`BREVO_API_KEY`** - Your Brevo API key
  - Get this from: Brevo Dashboard → Settings → API Keys
  - Example: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Optional Variables

- **`BREVO_LIST_ID`** - The ID of your newsletter contact list in Brevo
  - Get this from: Brevo Dashboard → Contacts → Lists
  - If not set, contacts will be added but not automatically subscribed to a list
  - Example: `2`

- **`BREVO_SENDER_EMAIL`** - Email address to send transactional emails from
  - Default: `noreply@seniorbydesign.com`
  - Must be verified in your Brevo account
  - Example: `noreply@seniorbydesign.com`

- **`BREVO_SENDER_NAME`** - Display name for transactional emails
  - Default: `Senior By Design`
  - Example: `Senior By Design`

- **`BREVO_ADMIN_EMAIL`** - Email address to receive contact form notifications
  - Default: `info@seniorbydesign.com`
  - Example: `info@seniorbydesign.com`

- **`NEXT_PUBLIC_BROCHURE_DOWNLOAD_URL`** - URL for digital brochure download link
  - Used in confirmation emails for digital brochure requests
  - Example: `https://seniorbydesign.com/brochure.pdf`

## Setup Steps

1. **Create a Brevo Account**
   - Sign up at https://www.brevo.com/
   - Verify your account

2. **Get Your API Key**
   - Go to Settings → API Keys
   - Create a new API key or use an existing one
   - Copy the API key and add it to your `.env.local` as `BREVO_API_KEY`

3. **Create a Contact List (Optional but Recommended)**
   - Go to Contacts → Lists
   - Create a new list (e.g., "Newsletter Subscribers")
   - Copy the list ID and add it to your `.env.local` as `BREVO_LIST_ID`

4. **Verify Sender Email**
   - Go to Settings → Senders & IP
   - Add and verify the email address you want to use for sending emails
   - This should match `BREVO_SENDER_EMAIL` (or use the default)

5. **Set Up Contact Attributes (Optional)**
   - The integration automatically maps form fields to Brevo contact attributes:
     - `FIRSTNAME` - First name
     - `LASTNAME` - Last name
     - `ADDRESS` - Street address
     - `CITY` - City
     - `STATE` - State
     - `ZIP` - ZIP code
     - `BROCHURE_TYPE` - "digital" or "physical"
   - These attributes will be created automatically if they don't exist

## Features

### Newsletter Subscription (`/api/newsletter`)
- Adds contacts to Brevo with all form data
- Automatically subscribes to newsletter list if `BREVO_LIST_ID` is set
- Sends confirmation email for digital brochure requests
- Handles duplicate contacts gracefully

### Contact Form (`/api/contact`)
- Sends contact form submissions to admin email via Brevo
- Includes all form data (name, email, phone, message)
- Can optionally send auto-reply to user (currently commented out)

## Testing

After setting up your environment variables:

1. Test newsletter subscription:
   - Submit the form at `/newsletter-and-brochure`
   - Check your Brevo dashboard → Contacts to see if the contact was added

2. Test contact form:
   - Submit the contact form at `/contact`
   - Check the email address set in `BREVO_ADMIN_EMAIL`

## Troubleshooting

- **"BREVO_API_KEY environment variable is not set"**
  - Make sure you've added `BREVO_API_KEY` to your `.env.local` file
  - Restart your development server after adding environment variables

- **Emails not sending**
  - Verify your sender email is verified in Brevo
  - Check that your Brevo account has transactional email credits
  - Check server logs for detailed error messages

- **Contacts not being added**
  - Verify your API key is correct
  - Check that the API key has the necessary permissions
  - Check server logs for detailed error messages

## Additional Resources

- [Brevo API Documentation](https://developers.brevo.com/)
- [Brevo Node.js SDK](https://github.com/getbrevo/brevo-nodejs)
