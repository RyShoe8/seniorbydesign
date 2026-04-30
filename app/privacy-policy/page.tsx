import { Metadata } from 'next';
import { generateSEOMetadata, JSONLDSchema, BreadcrumbSchema } from '@/components/SEO';
import styles from './page.module.css';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Privacy Policy - Senior By Design',
  description: 'Privacy Policy for Senior By Design. Learn how we collect, use, and protect your personal information.',
  url: '/privacy-policy',
  type: 'website',
});

export default function PrivacyPolicy() {
  return (
    <>
      <JSONLDSchema schema={BreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Privacy Policy', url: '/privacy-policy' },
      ])} />
      <div className={styles.privacyPolicy}>
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: April 29, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Senior By Design (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website seniorbydesign.com (the &quot;Site&quot;) and use our services.
          </p>
          <p>
            By using our Site, you consent to the data practices described in this Privacy Policy. If you do not agree with the practices described in this policy, please do not use our Site.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Information You Provide</h3>
          <p>We collect information that you voluntarily provide to us, including:</p>
          <ul>
            <li><strong>Contact Information:</strong> Name, email address, phone number, company name</li>
            <li><strong>Communication Data:</strong> Messages you send through our contact form</li>
            <li><strong>Newsletter Data:</strong> Email address and preferences when you subscribe to our newsletter</li>
            <li><strong>Brochure Requests:</strong> Information provided when requesting digital or physical brochures</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you visit our Site, we automatically collect certain information, including:</p>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Location Data:</strong> General geographic location based on IP address</li>
            <li><strong>Cookies and Tracking Technologies:</strong> See our Cookie Policy below</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To send you newsletters, marketing communications, and promotional materials (with your consent)</li>
            <li>To fulfill brochure requests and deliver requested materials</li>
            <li>To improve our website, services, and user experience</li>
            <li>To analyze website usage and trends</li>
            <li>To comply with legal obligations and protect our rights</li>
            <li>To prevent fraud and ensure website security</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis for Processing (GDPR)</h2>
          <p>If you are located in the European Economic Area (EEA), we process your personal data based on the following legal grounds:</p>
          <ul>
            <li><strong>Consent:</strong> When you subscribe to our newsletter or request marketing communications</li>
            <li><strong>Contract Performance:</strong> To fulfill our obligations when you request services or information</li>
            <li><strong>Legitimate Interests:</strong> To improve our services, analyze website usage, and ensure security</li>
            <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2>5. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          
          <h3>5.1 Service Providers</h3>
          <p>We use third-party service providers to help us operate our business and administer activities on our behalf, including:</p>
          <ul>
            <li><strong>Brevo (formerly Sendinblue):</strong> For email marketing and contact management</li>
            <li><strong>Vercel:</strong> For website hosting and infrastructure</li>
            <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
            <li>
              <strong>Google reCAPTCHA v3:</strong> We use reCAPTCHA on our contact form and newsletter/brochure
              sign-up flows to reduce spam and automated abuse. This service may process certain device and
              interaction data and send it to Google for risk analysis. For more information, see Google&apos;s{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              .
            </li>
            <li><strong>Ahrefs:</strong> For website analytics</li>
          </ul>
          <p>These service providers are contractually obligated to protect your information and use it only for the purposes we specify.</p>

          <h3>5.2 Legal Requirements</h3>
          <p>We may disclose your information if required by law or in response to valid requests by public authorities.</p>

          <h3>5.3 Business Transfers</h3>
          <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
        </section>

        <section>
          <h2>6. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:</p>
          <ul>
            <li>Contact form submissions: Retained for 3 years or until you request deletion</li>
            <li>Newsletter subscriptions: Retained until you unsubscribe</li>
            <li>Website analytics data: Retained for 26 months (Google Analytics default)</li>
          </ul>
        </section>

        <section>
          <h2>7. Your Rights (GDPR & CCPA)</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          
          <h3>7.1 Access</h3>
          <p>You have the right to request access to the personal information we hold about you.</p>

          <h3>7.2 Rectification</h3>
          <p>You have the right to request correction of inaccurate or incomplete personal information.</p>

          <h3>7.3 Erasure (&quot;Right to be Forgotten&quot;)</h3>
          <p>You have the right to request deletion of your personal information, subject to certain exceptions.</p>

          <h3>7.4 Restriction of Processing</h3>
          <p>You have the right to request restriction of processing of your personal information.</p>

          <h3>7.5 Data Portability</h3>
          <p>You have the right to receive your personal information in a structured, commonly used, and machine-readable format.</p>

          <h3>7.6 Objection</h3>
          <p>You have the right to object to processing of your personal information for direct marketing purposes.</p>

          <h3>7.7 Withdraw Consent</h3>
          <p>You have the right to withdraw your consent at any time where we rely on consent to process your information.</p>

          <h3>7.8 Opt-Out (CCPA)</h3>
          <p>If you are a California resident, you have the right to opt-out of the sale of personal information (we do not sell personal information).</p>

          <p>
            To exercise any of these rights, please contact us at <a href="mailto:info@seniorbydesign.com">info@seniorbydesign.com</a> or use the contact form on our website.
          </p>
        </section>

        <section>
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our Site and store certain information. Types of cookies we use include:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the Site to function properly</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Site</li>
            <li><strong>Marketing Cookies:</strong> Used to track visitors across websites for marketing purposes</li>
          </ul>
          <p>You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our Site.</p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.</p>
        </section>

        <section>
          <h2>10. Children&apos;s Privacy</h2>
          <p>Our Site is not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.</p>
        </section>

        <section>
          <h2>11. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
        </section>

        <section>
          <h2>12. Third-Party Links</h2>
          <p>Our Site may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
        </section>

        <section>
          <h2>13. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.</p>
        </section>

        <section>
          <h2>14. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:info@seniorbydesign.com">info@seniorbydesign.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:8337733744">(833) 773-3744</a></li>
            <li><strong>Website:</strong> <a href="/contact">Contact Form</a></li>
          </ul>
          <p>
            <strong>Data Controller:</strong><br />
            Senior By Design<br />
            [Your Business Address]<br />
            United States
          </p>
        </section>

        <section>
          <h2>15. Supervisory Authority</h2>
          <p>If you are located in the EEA and believe we have not addressed your concerns, you have the right to lodge a complaint with your local data protection authority.</p>
        </section>
      </div>
    </div>
    </>
  );
}
