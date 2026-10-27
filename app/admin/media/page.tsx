'use client';
import { useAdminFeedback, CollectionToolbar, matchesSearch } from '@/components/admin/AdminTools';

import { useState, useEffect, useCallback } from 'react';
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
  const notify = useAdminFeedback();
  const [query, setQuery] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [filterFolder, setFilterFolder] = useState<string>('all');


  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/media');
      if (!response.ok) throw new Error('Unable to load images');
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      setLoadError('Content could not be loaded. Please try Refresh.'); notify('Unable to complete this request. Please try again.'); } finally {
      setIsLoading(false);
    }
  }, [notify]);
  useEffect(() => { fetchMedia(); }, [fetchMedia]);

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
        notify('Failed to save changes');
      }
    } catch (error) {
            notify('Error saving changes');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!item._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.displayName || item.filePath}"?\n\nThis will remove the media entry from the library. The actual file will remain on the server.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/media?id=${item._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMedia();
        if (editingItem?._id === item._id) {
          setEditingItem(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete media' }));
        notify(errorData.error || 'Failed to delete media');
      }
    } catch (error) {
      notify('Error deleting media');
    }
  };

  const folders = ['all', ...Array.from(new Set(mediaItems.map(item => item.folder || 'root').filter(Boolean)))];

  const filteredItems = mediaItems.filter(item => (filterFolder === 'all' || (item.folder || 'root') === filterFolder) && matchesSearch(query, item.displayName, item.altText, item.filePath));

  const [isUploading, setIsUploading] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { compressImageFile } = await import('@/lib/client-image-compressor');
      const compressed = await compressImageFile(file, 500, 2400);

      const formData = new FormData();
      formData.append('file', compressed.file);
      formData.append('folder', 'media');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchMedia();
      } else {
        notify('Upload failed');
      }
    } catch {
      notify('Error uploading file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Media library</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Upload, view, and manage media assets. Large images are automatically compressed to &le; 500KB.
          </p>
        </div>
        <div className="filter-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="admin-upload-control">
            {isUploading ? 'Preparing image…' : 'Upload an image'}
            <input type="file" accept="image/*" onChange={handleMediaUpload} disabled={isUploading} />
          </label>

          <div>
            <label htmlFor="folderFilter" style={{ marginRight: '0.5rem' }}>Folder:</label>
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
      </div>

      <CollectionToolbar query={query} onQuery={setQuery} count={filteredItems.length} total={mediaItems.length} label="images" loading={isLoading} error={loadError} onRefresh={fetchMedia} />
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
                  <p className="media-alt">{item.altText && item.altText.trim() ? item.altText : <em>No alt text</em>}</p>
                  <p className="media-path">{item.filePath}</p>
                  <div className="media-actions">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="btn-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="btn-small btn-delete"
                    >
                      Delete
                    </button>
                  </div>
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

        @media (max-width: 768px) {
          .media-card {
            border-radius: 4px;
          }

          .media-info {
            padding: var(--spacing-xs);
          }

          .media-name {
            margin-bottom: var(--spacing-xs);
          }

          .media-alt {
            margin-bottom: var(--spacing-xs);
          }

          .media-path {
            margin-bottom: var(--spacing-xs);
          }

          .media-edit-form {
            padding: var(--spacing-xs);
          }

          .form-group {
            margin-bottom: var(--spacing-xs);
          }
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

        .btn:hover {
          background-color: var(--sbd-brown);
        }

        .btn-secondary {
          background-color: transparent;
          border: 2px solid var(--sbd-gold);
          color: var(--sbd-brown);
        }

        .btn-secondary:hover {
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 14px;
        }

        .media-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }

        .btn-delete {
          background-color: #dc3545;
          color: #fff;
        }

        .btn-delete:hover {
          background-color: #c82333;
        }

        @media (max-width: 768px) {
          .media-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }

          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-controls {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .filter-select {
            width: 100%;
            min-height: 44px;
          }

          .form-input {
            min-height: 44px;
            font-size: 16px;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }

          .media-actions {
            flex-direction: column;
          }

          .media-actions .btn {
            width: 100%;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
}


