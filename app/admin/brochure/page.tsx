'use client';

import { useState, useEffect } from 'react';

interface BrochureSettings {
  _id?: string;
  allowMailRequests: boolean;
  updatedAt?: string;
}

export default function BrochureManagement() {
  const [settings, setSettings] = useState<BrochureSettings>({
    allowMailRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/brochure');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching brochure settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Brochure settings saved successfully!');
        fetchSettings();
      } else {
        alert('Error saving brochure settings');
      }
    } catch (error) {
      console.error('Error saving brochure settings:', error);
      alert('Error saving brochure settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      allowMailRequests: e.target.checked,
    });
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-page">
      <h1>Brochure Settings</h1>
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h2>Brochure Request Options</h2>
          
          <div className="form-group">
            <label htmlFor="allowMailRequests" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="allowMailRequests"
                checked={settings.allowMailRequests}
                onChange={handleToggle}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Allow users to request brochure by mail</span>
            </label>
            <p style={{ marginTop: '0.5rem', fontSize: '14px', color: 'var(--warm-grey-3)', marginLeft: '28px' }}>
              {settings.allowMailRequests 
                ? 'Users can choose to download the brochure digitally or request a physical copy by mail.'
                : 'Users can only download the brochure digitally. The mail request option will be hidden.'}
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        .admin-form {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
          margin-bottom: var(--spacing-xl);
        }

        .form-section {
          margin-bottom: var(--spacing-xl);
        }

        .form-section h2 {
          margin-bottom: var(--spacing-md);
          color: var(--sbd-brown);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .btn:hover:not(:disabled) {
          background-color: var(--sbd-brown);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
