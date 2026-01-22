'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BlogPost {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  featuredImage?: string;
  author: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('');
  const [bodyTextareaRef, setBodyTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      // Error fetching blog posts
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
          }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFeaturedImageUrl(post.featuredImage || '');
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'blog');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFeaturedImageUrl(data.url);
      } else {
        alert('Failed to upload featured image');
      }
    } catch (error) {
      alert('Error uploading featured image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBodyImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'blog');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url;
        
        // Insert image HTML into body textarea at cursor position
        const textarea = document.getElementById('body') as HTMLTextAreaElement;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          const imageHtml = `\n\n<img src="${imageUrl}" alt="" />\n\n`;
          
          textarea.value = text.substring(0, start) + imageHtml + text.substring(end);
          textarea.focus();
          textarea.setSelectionRange(start + imageHtml.length, start + imageHtml.length);
          
          // Trigger input event to update React state if needed
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
            alert('Error uploading image');
    } finally {
      setUploadingBodyImage(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      body: formData.get('body') as string,
      featuredImage: featuredImageUrl || '',
      author: formData.get('author') as string,
      published: formData.get('published') === 'on',
    };

    try {
      const url = editingPost?._id 
        ? `/api/admin/blog/${editingPost._id}`
        : '/api/admin/blog';
      
      const response = await fetch(url, {
        method: editingPost?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchPosts();
        setShowForm(false);
        setEditingPost(null);
        setFeaturedImageUrl('');
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      alert('Error saving blog post');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setFeaturedImageUrl('');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Blog Management</h1>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingPost(null);
            setFeaturedImageUrl('');
          }} 
          className="btn"
        >
          Add Post
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal" onClick={handleCloseForm}>
          <div className="admin-form-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingPost ? 'Edit' : 'Add'} Blog Post</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  defaultValue={editingPost?.title || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  defaultValue={editingPost?.slug || ''}
                  placeholder="will-be-generated-from-title-if-empty"
                />
                <small style={{ color: 'var(--warm-grey-3)', fontSize: '14px' }}>
                  Leave empty to auto-generate from title
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="excerpt">Excerpt *</label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  required
                  defaultValue={editingPost?.excerpt || ''}
                  placeholder="Brief description of the post"
                />
              </div>
              <div className="form-group">
                <label htmlFor="body">Body Content *</label>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <label htmlFor="bodyImageUpload" style={{ cursor: 'pointer' }}>
                    <input
                      type="file"
                      id="bodyImageUpload"
                      accept="image/*"
                      onChange={handleBodyImageUpload}
                      disabled={uploadingBodyImage}
                      style={{ display: 'none' }}
                    />
                    <span className="btn-small" style={{ display: 'inline-block', pointerEvents: 'none' }}>
                      {uploadingBodyImage ? 'Uploading...' : 'Insert Image'}
                    </span>
                  </label>
                  <small style={{ color: 'var(--warm-grey-3)', fontSize: '14px' }}>
                    Click &quot;Insert Image&quot; to upload and add an image to your post content
                  </small>
                </div>
                <textarea
                  id="body"
                  name="body"
                  rows={15}
                  required
                  defaultValue={editingPost?.body || ''}
                  placeholder="You can insert images using the 'Insert Image' button above. Images will be inserted as HTML img tags."
                />
              </div>
              <div className="form-group">
                <label htmlFor="author">Author *</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  required
                  defaultValue={editingPost?.author || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="featuredImageUpload">Featured Image</label>
                <input
                  type="file"
                  id="featuredImageUpload"
                  name="featuredImageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="upload-status">Uploading...</p>}
                {featuredImageUrl && (
                  <div className="image-preview">
                    <div style={{ position: 'relative', width: '300px', height: '200px', marginTop: '1rem' }}>
                      <Image 
                        src={featuredImageUrl} 
                        alt="Featured preview" 
                        fill
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                        unoptimized={featuredImageUrl.startsWith('http')}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-small btn-danger"
                      onClick={() => setFeaturedImageUrl('')}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={!!editingPost?.publishedAt}
                  />
                  Publish immediately
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCloseForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Published</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    No blog posts yet. Click &quot;Add Post&quot; to create one.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post._id}>
                    <td>{post.title}</td>
                    <td>{post.author}</td>
                    <td>{post.publishedAt ? 'Yes' : 'No'}</td>
                    <td>
                      {post.publishedAt 
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : post.createdAt 
                        ? new Date(post.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <button onClick={() => handleEdit(post)} className="btn-small">Edit</button>
                      <button onClick={() => post._id && handleDelete(post._id)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

        .admin-header h1 {
          flex: 1;
          min-width: 0;
        }

        .admin-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .admin-form-content {
          background: #fff;
          padding: var(--spacing-xl);
          border-radius: 8px;
          max-width: 900px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .admin-form-content h2 {
          margin-bottom: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
        }

        .form-group textarea {
          resize: vertical;
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

        .btn-secondary {
          background-color: transparent;
          border: 2px solid var(--sbd-gold);
          color: var(--sbd-brown);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: var(--sbd-gold);
          color: #fff;
        }

        .admin-table-container {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          min-width: 800px;
        }

        .admin-table th,
        .admin-table td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
          overflow: hidden;
          word-wrap: break-word;
        }

        .admin-table th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .admin-table th:nth-child(1) {
          width: 30%;
        }

        .admin-table th:nth-child(2) {
          width: 15%;
        }

        .admin-table th:nth-child(3) {
          width: 10%;
        }

        .admin-table th:nth-child(4) {
          width: 15%;
        }

        .admin-table th:nth-child(5) {
          width: 30%;
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 14px;
          margin-right: 0.5rem;
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .upload-status {
          color: var(--sbd-gold);
          font-size: 14px;
          margin-top: 0.5rem;
        }

        .image-preview {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
