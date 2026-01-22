import Link from 'next/link';

export default function Footer() {
  const companyLinks = [
    { href: '/the-firm', label: 'The Firm' },
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
            <p className="footer-contact">
              <a href="tel:8337733744">(833) 773-3744</a>
            </p>
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
          color: var(--warm-grey-1);
          padding: var(--spacing-xl) 0 var(--spacing-md);
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
        }

        .footer-links {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-links a {
          color: var(--warm-grey-1);
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: var(--sbd-gold);
        }

        .footer-contact {
          margin-bottom: var(--spacing-sm);
        }

        .footer-contact a {
          color: var(--warm-grey-1);
          font-size: 19px;
        }

        .footer-newsletter-link {
          display: inline-block;
          color: var(--sbd-gold);
          text-decoration: underline;
          margin-bottom: var(--spacing-md);
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
          transition: color 0.3s ease;
          font-size: 16px;
        }

        .social-link:hover {
          color: var(--sbd-gold);
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




