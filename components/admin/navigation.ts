export const adminSections = [
  { label: 'Workspace', items: [{ href: '/admin', label: 'Overview', icon: '◈', description: 'Your website, at a glance.' }] },
  { label: 'Website content', items: [
    { href: '/admin/homepage', label: 'Homepage', icon: '⌂', description: 'Manage partner logos and the testimonials featured on your homepage.' },
    { href: '/admin/portfolio', label: 'Portfolio', icon: '▦', description: 'Curate your portfolio categories, photography, and image descriptions.' },
    { href: '/admin/services', label: 'Services', icon: '◇', description: 'Keep service descriptions and imagery clear, current, and inviting.' },
    { href: '/admin/team', label: 'Team profiles', icon: '♙', description: 'Introduce the people behind SBD. These profiles appear on the public website.' },
    { href: '/admin/projects', label: 'Project map', icon: '◎', description: 'Manage locations on the public project map. Client portal projects are managed separately.' },
    { href: '/admin/blog', label: 'Journal & news', icon: '≡', description: 'Write, preview, and publish stories from Senior By Design.' },
    { href: '/admin/resources', label: 'Resources & links', icon: '↗', description: 'Maintain the helpful links shared with your website visitors.' },
  ] },
  { label: 'Brand & outreach', items: [
    { href: '/admin/design-guide', label: 'Brochure builder', icon: '▤', description: 'Edit the digital brochure section by section, then preview your changes.' },
    { href: '/admin/brochure', label: 'Brochure requests', icon: '✉', description: 'Review request activity, update delivery settings, and email a brochure.' },
    { href: '/admin/media', label: 'Media library', icon: '▧', description: 'Find images, upload new assets, and improve their accessibility descriptions.' },
    { href: '/admin/signature', label: 'Email signatures', icon: '✎', description: 'Create a consistent, professional signature for every member of the team.' },
  ] },
  { label: 'Administration', items: [{ href: '/admin/users', label: 'Staff access', icon: '⚙', description: 'Invite SBD staff and manage their access to the website workspace.' }] },
];
