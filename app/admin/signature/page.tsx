'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  renderSignature,
  type SignatureProfile,
  type SignatureBrand,
  type SignatureTemplate,
  type SignatureElement,
  mockSignatureBrand,
} from '@seniorbydesign/signature-engine';
import { SignatureForm } from '@/components/admin/signature/SignatureForm';
import { SignaturePreview } from '@/components/admin/signature/SignaturePreview';
import { CopyButton } from '@/components/admin/signature/CopyButton';
import styles from './page.module.css';

type Layout = SignatureTemplate['layout'];

type ToggleState = {
  showSocial: boolean;
  showLocations: boolean;
  showWarehouse: boolean;
  showDivider: boolean;
  useAnimation: boolean;
};

function togglesFromElements(elements: SignatureElement[]): ToggleState {
  return {
    showSocial: elements.some((e) => e.type === 'social'),
    showLocations: elements.some((e) => e.type === 'locations'),
    showWarehouse: elements.some((e) => e.type === 'warehouse'),
    showDivider: elements.some((e) => e.type === 'divider'),
    useAnimation: elements.some((e) => e.type === 'animation'),
  };
}

function buildElements(t: ToggleState): SignatureElement[] {
  const out: SignatureElement[] = [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
  ];
  if (t.showSocial) out.push({ type: 'social' });
  if (t.showDivider) out.push({ type: 'divider' });
  if (t.showLocations) out.push({ type: 'locations' });
  if (t.showWarehouse) out.push({ type: 'warehouse' });
  if (t.useAnimation) out.push({ type: 'animation' });
  return out;
}

const defaultProfile: SignatureProfile = {
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  phone: '',
};

const FONT_OPTIONS = ['Arial', 'Georgia', 'Tahoma', 'Verdana', 'Helvetica'] as const;

export default function AdminSignaturePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [profile, setProfile] = useState<SignatureProfile>(defaultProfile);
  const [brand, setBrand] = useState<SignatureBrand>(() => ({
    ...mockSignatureBrand,
  }));
  const [layout, setLayout] = useState<Layout>('standard');
  const [toggles, setToggles] = useState<ToggleState>(() =>
    togglesFromElements(
      buildElements({
        showSocial: true,
        showLocations: true,
        showWarehouse: true,
        showDivider: true,
        useAnimation: false,
      })
    )
  );

  const template = useMemo<SignatureTemplate>(
    () => ({
      id: 'admin-live',
      name: 'Live template',
      layout,
      elements: buildElements(toggles),
    }),
    [layout, toggles]
  );

  const html = useMemo(
    () => renderSignature({ profile, brand, template }),
    [profile, brand, template]
  );

  const canCopy =
    profile.firstName.trim() !== '' &&
    profile.lastName.trim() !== '' &&
    profile.email.trim() !== '';

  const setBrandField =
    <K extends keyof SignatureBrand>(key: K) =>
    (value: SignatureBrand[K]) => {
      setBrand((b) => ({ ...b, [key]: value }));
    };

  const setSocial = (key: keyof SignatureBrand['socialLinks'], value: string) => {
    setBrand((b) => ({
      ...b,
      socialLinks: { ...b.socialLinks, [key]: value || undefined },
    }));
  };

  const setLocation = (key: keyof SignatureBrand['locations'], value: string) => {
    setBrand((b) => ({
      ...b,
      locations: { ...b.locations, [key]: value || undefined },
    }));
  };

  return (
    <div className={styles.page}>
      <h1>Email signature</h1>
      <p className={styles.lead}>
        Admins set organization branding and which blocks appear. Everyone enters their own name,
        title, and contact details, then copies the HTML for Gmail or Outlook.
      </p>

      <div className={styles.grid}>
        {isAdmin ? (
          <section className={styles.card}>
            <h2>Brand &amp; template</h2>
            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="checkbox"
                  checked={toggles.showSocial}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showSocial: e.target.checked }))
                  }
                />
                Show social
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={toggles.showLocations}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showLocations: e.target.checked }))
                  }
                />
                Show locations
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={toggles.showWarehouse}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showWarehouse: e.target.checked }))
                  }
                />
                Show warehouse
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={toggles.showDivider}
                  onChange={(e) =>
                    setToggles((t) => ({ ...t, showDivider: e.target.checked }))
                  }
                />
                Show divider
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={toggles.useAnimation}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setToggles((t) => ({ ...t, useAnimation: on }));
                    setBrand((b) => ({
                      ...b,
                      animation: {
                        enabled: on,
                        gifUrl: b.animation?.gifUrl ?? '',
                      },
                    }));
                  }}
                />
                Use animated logo (GIF)
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Layout
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as Layout)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  minWidth: '220px',
                  fontSize: '14px',
                }}
              >
                <option value="standard">Standard (logo left)</option>
                <option value="stacked">Stacked (logo top)</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Font
              <select
                value={brand.fontFamily}
                onChange={(e) => setBrandField('fontFamily')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  minWidth: '220px',
                  fontSize: '14px',
                }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Primary color
              <input
                type="text"
                value={brand.primaryColor}
                onChange={(e) => setBrandField('primaryColor')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '320px',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Logo image URL
              <input
                type="url"
                value={brand.logoUrl}
                onChange={(e) => setBrandField('logoUrl')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Logo link (click-through URL)
              <input
                type="url"
                value={brand.logoLink}
                onChange={(e) => setBrandField('logoLink')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Animated GIF URL (optional; first frame should look good in Outlook)
              <input
                type="url"
                value={brand.animation?.gifUrl ?? ''}
                onChange={(e) =>
                  setBrand((b) => ({
                    ...b,
                    animation: {
                      enabled: Boolean(b.animation?.enabled),
                      gifUrl: e.target.value,
                    },
                  }))
                }
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Website
              <input
                type="text"
                value={brand.website}
                onChange={(e) => setBrandField('website')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '14px' }}>
              Company name (stored for future templates)
              <input
                type="text"
                value={brand.companyName}
                onChange={(e) => setBrandField('companyName')(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  padding: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                }}
              />
            </label>

            <fieldset
              style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '0.75rem' }}
            >
              <legend style={{ fontSize: '13px', padding: '0 0.35rem' }}>Social</legend>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                LinkedIn
                <input
                  type="url"
                  value={brand.socialLinks.linkedin ?? ''}
                  onChange={(e) => setSocial('linkedin', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Facebook
                <input
                  type="url"
                  value={brand.socialLinks.facebook ?? ''}
                  onChange={(e) => setSocial('facebook', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', fontSize: '13px' }}>
                Instagram
                <input
                  type="url"
                  value={brand.socialLinks.instagram ?? ''}
                  onChange={(e) => setSocial('instagram', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
            </fieldset>

            <fieldset
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '0.75rem',
                marginTop: '0.75rem',
              }}
            >
              <legend style={{ fontSize: '13px', padding: '0 0.35rem' }}>Addresses</legend>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Dallas
                <input
                  type="text"
                  value={brand.locations.dallas ?? ''}
                  onChange={(e) => setLocation('dallas', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                Boulder
                <input
                  type="text"
                  value={brand.locations.boulder ?? ''}
                  onChange={(e) => setLocation('boulder', e.target.value)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', fontSize: '13px' }}>
                Warehouse
                <input
                  type="text"
                  value={brand.warehouseAddress ?? ''}
                  onChange={(e) => setBrandField('warehouseAddress')(e.target.value || undefined)}
                  style={{ display: 'block', marginTop: '0.25rem', padding: '0.45rem', width: '100%' }}
                />
              </label>
            </fieldset>
          </section>
        ) : (
          <section className={styles.card}>
            <h2>Brand &amp; template</h2>
            <p className={styles.notice}>
              Only administrators can change organization branding. Your preview uses the current
              organization defaults.
            </p>
          </section>
        )}

        <section className={styles.card}>
          <h2>Your signature</h2>
          <SignatureForm value={profile} onChange={setProfile} />
          {!canCopy && (
            <p className={styles.error}>Enter first name, last name, and email to enable copying.</p>
          )}
        </section>

        <section className={`${styles.card} ${styles.previewSection}`}>
          <h2>Preview</h2>
          <SignaturePreview html={html} />
          <div className={styles.row}>
            <CopyButton html={html} disabled={!canCopy} />
          </div>
          <div className={styles.hint}>
            <p>
              <strong>How to paste:</strong> Use <strong>Copy signature</strong>, then open Gmail
              → Settings → General → Signature, or Outlook → File → Options → Mail → Signatures,
              and paste. Outlook may show only the first frame of an animated GIF; design that
              frame to look good on its own.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
