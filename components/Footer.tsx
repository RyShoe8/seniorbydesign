import Link from 'next/link';
import EntityContactBlock from '@/components/EntityContactBlock';

export default function Footer() {
  const companyLinks = [
    { href: '/senior-living-design-firm', label: 'The Firm' },
    { href: '/team', label: 'The Team' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
  ];

  const servicesLinks = [
    { href: '/services', label: 'Services' },
  ];

  const workLinks = [
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Services</h4>
            <ul className="footer-links">
              {servicesLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Our Work</h4>
            <ul className="footer-links">
              {workLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Contact</h4>
            <EntityContactBlock variant="compact" className="footer-nap" />
            <Link href="/newsletter-and-brochure" className="footer-newsletter-link">
              Newsletter & Brochure
            </Link>
            <div className="footer-social">
              <h5 className="footer-social-heading">Follow Us</h5>
              <div className="social-links">
                <a href="https://www.facebook.com/Seniorbydesign" target="_blank" rel="noopener noreferrer" className="social-link">
                  Facebook
                </a>
                <a href="https://www.linkedin.com/company/senior-by-design/" target="_blank" rel="noopener noreferrer" className="social-link">
                  LinkedIn
                </a>
                <a href="https://www.youtube.com/@SeniorByDesign" target="_blank" rel="noopener noreferrer" className="social-link">
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Senior By Design. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background-color: var(--sbd-brown);
          background: linear-gradient(180deg, #3d2619 0%, #2a1f16 100%);
          color: var(--warm-grey-1);
          padding: var(--spacing-xl) 0 var(--spacing-md);
          box-shadow: inset 0 24px 48px -24px rgba(0, 0, 0, 0.4);
        }

        .footer-container {
          max-width: var(--container-max-width);
          margin: 0 auto;
          padding: 0 var(--container-padding);
        }

        @media (max-width: 768px) {
          .footer-container {
            width: 100%;
            max-width: 100%;
            padding: 0 var(--container-padding-mobile, 1rem);
          }
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .footer-heading {
          color: var(--sbd-gold);
          font-size: 24px;
          margin-bottom: var(--spacing-sm);
          text-shadow: 0 0 12px rgba(203, 172, 109, 0.2);
          letter-spacing: 0.02em;
        }

        .footer-links {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-links a {
          color: var(--warm-grey-1);
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-links a:hover {
          color: #fff;
          transform: translateX(4px);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }

        .footer-contact {
          margin-bottom: var(--spacing-sm);
        }

        .footer-nap {
          margin-bottom: var(--spacing-sm);
          color: var(--warm-grey-1);
        }

        .footer-nap a {
          color: var(--warm-grey-1);
        }

        .footer-nap a:hover {
          color: var(--sbd-gold);
        }

        .footer-nap strong {
          color: var(--warm-grey-1);
        }

        .footer-newsletter-link {
          display: inline-block;
          color: var(--sbd-gold);
          text-decoration: none;
          margin-bottom: var(--spacing-md);
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .footer-newsletter-link:hover {
          color: #fff;
          text-shadow: 0 0 12px rgba(203, 172, 109, 0.6);
        }

        .footer-social {
          margin-top: var(--spacing-md);
        }

        .footer-social-heading {
          color: var(--sbd-gold);
          font-size: 18px;
          margin-bottom: var(--spacing-xs);
          font-weight: 600;
        }

        .social-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .social-link {
          color: var(--warm-grey-1);
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 16px;
          display: inline-block;
        }

        .social-link:hover {
          color: #fff;
          transform: translateX(4px);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }

        .footer-bottom {
          border-top: 1px solid rgba(214, 209, 202, 0.3);
          padding-top: var(--spacing-md);
          text-align: center;
        }

        .footer-bottom p {
          color: var(--warm-grey-1);
          font-size: 16px;
        }

        @media (max-width: 968px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
          }

          .footer-heading {
            font-size: 20px;
            margin-bottom: var(--spacing-xs);
          }

          .footer-links li {
            margin-bottom: 0.4rem;
          }

          .footer-contact {
            margin-bottom: var(--spacing-xs);
          }

          .footer-contact a {
            font-size: 17px;
          }
        }
      `}</style>
    </footer>
  );
}




