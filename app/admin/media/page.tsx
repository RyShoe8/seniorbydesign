'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminFeedback } from '@/components/admin/AdminTools';
import styles from './page.module.css';

const folders = [
  { name: 'Logos', description: 'Primary logos, transparent versions, and favicon.', files: [
    ['Logo · transparent background', '/images/sbd-logo-transparent.png'],
    ['Logo · no tagline', '/images/sbd-logo-no-tagline.png'],
    ['Original SBD logo', '/images/SBD Logo.webp'],
    ['Website favicon', '/images/favicon.png'],
  ] },
  { name: 'Brochures', description: 'Downloadable brochure and the current digital edition.', files: [
    ['SBD Interactive Brochure', '/files/SBD Interactive Brochure.pdf'],
  ] },
  { name: 'Email & social', description: 'Logo and social icons used in branded emails.', files: [
    ['Email logo', '/email-assets/sbd-logo.png'],
    ['LinkedIn icon', '/email-assets/icon-linkedin.png'],
    ['Instagram icon', '/email-assets/icon-instagram.png'],
    ['Facebook icon', '/email-assets/icon-facebook.png'],
  ] },
  { name: 'Website photography', description: 'Selected hero images used throughout the website.', files: [
    ['The firm', '/images/senior-living-firm-hero-design-sbd.webp'],
    ['Our culture', '/images/senior-living-firm-culture-design-sbd.webp'],
    ['Services', '/images/senior-living-services-hero-design-sbd.jpg'],
    ['Portfolio', '/images/senior-living-portfolio-index-design-sbd.jpg'],
    ['Team', '/images/senior-living-team-hero-design-sbd.jpg'],
    ['Journal', '/images/senior-living-blog-journal-hero-design-sbd.jpg'],
    ['Newsletter', '/images/senior-living-newsletter-hero-design-sbd.jpg'],
  ] },
];

export default function BrandMedia() {
  const [folder, setFolder] = useState('All assets');
  const [search, setSearch] = useState('');
  const notify = useAdminFeedback();
  const assets = folders.flatMap(group => group.files.map(([name, url]) => ({ name, url, folder: group.name })));
  const visible = assets.filter(asset => (folder === 'All assets' || asset.folder === folder) && `${asset.name} ${asset.folder}`.toLowerCase().includes(search.trim().toLowerCase()));
  async function copy(url: string) {
    try { await navigator.clipboard.writeText(new URL(url, window.location.origin).href); notify('Asset link copied.'); }
    catch { notify('Unable to copy. Open the asset to copy its address.'); }
  }
  return <div className="admin-page">
    <div className="admin-header"><div><h1>Media</h1><p>Brand assets, organized and ready to use. Downloads preserve the original files.</p></div><Link className="btn" href="/admin/media/images">Manage website images</Link></div>
    <nav className={styles.folders} aria-label="Asset folders">
      <button aria-pressed={folder === 'All assets'} onClick={() => setFolder('All assets')}><strong>All assets</strong><span>{assets.length} files</span></button>
      {folders.map(group => <button key={group.name} aria-pressed={folder === group.name} onClick={() => setFolder(group.name)}><strong>{group.name}</strong><span>{group.description}</span><small>{group.files.length} files</small></button>)}
    </nav>
    <div className={styles.toolbar}><h2>{folder}</h2><label>Search assets<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a logo, brochure, or image…" /></label></div>
    {(folder === 'Brochures' || folder === 'Email & social') && <p className={styles.note}>{folder === 'Brochures' ? <>The PDF is a saved edition. Use the <Link href="/v2/experience" target="_blank" rel="noopener noreferrer">digital brochure</Link> for the current content or open the <Link href="/admin/design-guide">brochure builder</Link>.</> : <>Create a personalized signature in the <Link href="/admin/signature">email signature builder</Link>.</>}</p>}
    <p role="status">{visible.length} {visible.length === 1 ? 'asset' : 'assets'}</p>
    <div className={styles.grid}>{visible.map(asset => <article className={styles.card} key={asset.url}>
      <a className={styles.preview} href={asset.url} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${asset.name}`}>{asset.url.endsWith('.pdf') ? <span className={styles.pdf}>PDF<span>Interactive brochure</span></span> : <img src={asset.url} alt={asset.name} loading="lazy" />}</a>
      <div className={styles.details}><small>{asset.folder} · {asset.url.split('.').pop()?.toUpperCase()}</small><h3>{asset.name}</h3><div className={styles.actions}><a href={asset.url} download>Download</a><button onClick={() => copy(asset.url)}>Copy link</button></div></div>
    </article>)}</div>
    {!visible.length && <p>No assets match. Try another folder or search term.</p>}
  </div>;
}

