'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaItem {
  _id?: string;
  filePath: string;
  displayName: string;
  altText: string;
  folder?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function MediaManagement() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [filterFolder, setFilterFolder] = useState<string>('all');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/admin/media');
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (item: MediaItem) => {
    try {
      const response = await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: item._id,
          displayName: item.displayName,
          altText: item.altText,
        }),
      });

      if (response.ok) {
        fetchMedia();
        setEditingItem(null);
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error saving changes');
    }
  };

  const folders = ['all', ...Array.from(new Set(mediaItems.map(item => item.folder || 'root').filter(Boolean)))];

  const filteredItems = filterFolder === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => (item.folder || 'root') === filterFolder);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Media Management</h1>
        <div className="filter-controls">
          <label htmlFor="folderFilter">Filter by folder:</label>
          <select
            id="folderFilter"
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="filter-select"
          >
            {folders.map(folder => (
              <option key={folder} value={folder}>
                {folder === 'all' ? 'All Folders' : folder.replace('/images/', '')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p>Loading media...</p>
      ) : (
        <div className="media-grid">
          {filteredItems.map((item) => (
            <div key={item._id} className="media-card">
              <div className="media-image-container">
                <Image
                  src={item.filePath}
                  alt={item.altText || item.displayName}
                  width={300}
                  height={200}
                  className="media-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  Image not found
                </div>
              </div>
              
              {editingItem?._id === item._id && editingItem ? (
                <div className="media-edit-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={editingItem.displayName}
                      onChange={(e) => setEditingItem({ ...editingItem, displayName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Alt Text</label>
                    <textarea
                      value={editingItem.altText}
                      onChange={(e) => setEditingItem({ ...editingItem, altText: e.target.value })}
                      className="form-input"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>File Path</label>
                    <input
                      type="text"
                      value={item.filePath}
                      disabled
                      className="form-input form-input-disabled"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      onClick={() => handleSave(editingItem)}
                      className="btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingItem(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="media-info">
                  <h3 className="media-name">{item.displayName}</h3>
                  <p className="media-alt">{item.altText || <em>No alt text</em>}</p>
                  <p className="media-path">{item.filePath}</p>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="btn-small"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .filter-controls label {
          font-weight: 500;
          color: var(--sbd-brown);
        }

        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-lg);
        }

        .media-card {
          background: #fff;
          border: 1px solid var(--warm-grey-3);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.3s ease;
        }

        .media-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .media-image-container {
          position: relative;
          width: 100%;
          height: 250px;
          background: var(--warm-grey-1);
          overflow: hidden;
        }

        .media-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warm-grey-3);
          font-style: italic;
        }

        .media-info {
          padding: var(--spacing-md);
        }

        .media-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--sbd-brown);
          margin-bottom: var(--spacing-sm);
          word-break: break-word;
        }

        .media-alt {
          font-size: 14px;
          color: var(--warm-grey-3);
          margin-bottom: var(--spacing-sm);
          min-height: 40px;
        }

        .media-alt em {
          color: var(--warm-grey-3);
          font-style: italic;
        }

        .media-path {
          font-size: 12px;
          color: var(--warm-grey-3);
          font-family: monospace;
          margin-bottom: var(--spacing-md);
          word-break: break-all;
        }

        .media-edit-form {
          padding: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--sbd-brown);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
        }

        .form-input-disabled {
          background: var(--warm-grey-1);
          color: var(--warm-grey-3);
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .media-grid {
            grid-template-columns: 1fr;
          }

          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
