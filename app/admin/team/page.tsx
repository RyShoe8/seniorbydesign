'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TeamMember {
  _id?: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  profileImage?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  order: number;
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
          }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setProfileImageUrl(member.profileImage || '');
    setShowForm(true);
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfileImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'team');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImageUrl(data.url);
      } else {
        alert('Failed to upload profile image');
      }
    } catch (error) {
            alert('Error uploading profile image');
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get('slug') as string,
      name: formData.get('name') as string,
      title: formData.get('title') as string,
      bio: formData.get('bio') as string,
      profileImage: profileImageUrl || editingMember?.profileImage || '',
      linkedin: formData.get('linkedin') as string,
      facebook: formData.get('facebook') as string,
      instagram: formData.get('instagram') as string,
      order: parseInt(formData.get('order') as string) || 0,
    };

    try {
      const url = editingMember?._id 
        ? `/api/admin/team/${editingMember._id}`
        : '/api/admin/team';
      
      const response = await fetch(url, {
        method: editingMember?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchMembers();
        setShowForm(false);
        setEditingMember(null);
        setProfileImageUrl('');
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
          }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Team Management</h1>
        <button onClick={() => { 
          setShowForm(true); 
          setEditingMember(null);
          setProfileImageUrl('');
        }} className="btn">
          Add Team Member
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingMember ? 'Edit' : 'Add'} Team Member</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingMember?.name || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    defaultValue={editingMember?.title || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="order">Display Order *</label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    required
                    min="1"
                    defaultValue={editingMember?.order || members.length + 1}
                    placeholder="1"
                  />
                  <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginTop: '0.5rem' }}>
                    Setting order to 3 will place this team member 3rd and automatically shift others back.
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="slug">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  defaultValue={editingMember?.slug || ''}
                  placeholder="reid-bonner"
                />
              </div>
              <div className="form-group">
                <label htmlFor="profileImageUpload">Profile Image</label>
                <input
                  type="file"
                  id="profileImageUpload"
                  name="profileImageUpload"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploadingProfileImage}
                />
                {uploadingProfileImage && (
                  <p className="upload-status">Uploading...</p>
                )}
                {(profileImageUrl || editingMember?.profileImage) && (
                  <div className="image-preview">
                    <div style={{ position: 'relative', width: '200px', height: '200px', marginTop: '0.5rem' }}>
                      <Image 
                        src={profileImageUrl || editingMember?.profileImage || ''} 
                        alt="Profile preview" 
                        fill
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                        unoptimized={(profileImageUrl || editingMember?.profileImage || '').startsWith('https://')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImageUrl('');
                        if (editingMember) {
                          setEditingMember({ ...editingMember, profileImage: '' });
                        }
                      }}
                      className="btn-small btn-danger"
                      style={{ marginLeft: '0.5rem', marginTop: '0.5rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {!profileImageUrl && !editingMember?.profileImage && (
                  <p style={{ fontSize: '14px', color: 'var(--warm-grey-3)', marginTop: '0.5rem' }}>
                    Upload a profile image for this team member
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio *</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={8}
                  required
                  defaultValue={editingMember?.bio || ''}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="linkedin">LinkedIn URL</label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    defaultValue={editingMember?.linkedin || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="facebook">Facebook URL</label>
                  <input
                    type="url"
                    id="facebook"
                    name="facebook"
                    defaultValue={editingMember?.facebook || ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="instagram">Instagram URL</label>
                  <input
                    type="url"
                    id="instagram"
                    name="instagram"
                    defaultValue={editingMember?.instagram || ''}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn-secondary" onClick={() => { 
                  setShowForm(false); 
                  setEditingMember(null);
                  setProfileImageUrl('');
                }}>
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
        <>
          <div className="admin-table-container">
            <table className="admin-table admin-table-desktop">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Order</th>
                  <th>Slug</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td>{member.name}</td>
                    <td>{member.title}</td>
                    <td>{member.order || 0}</td>
                    <td>{member.slug}</td>
                    <td>
                      <button onClick={() => handleEdit(member)} className="btn-small">Edit</button>
                      <button onClick={() => member._id && handleDelete(member._id)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="team-cards-mobile">
            {members.map((member) => (
              <div key={member._id} className="team-card">
                <div className="team-card-content">
                  <div className="team-card-field">
                    <span className="team-card-label">Name:</span>
                    <span className="team-card-value">{member.name}</span>
                  </div>
                  <div className="team-card-field">
                    <span className="team-card-label">Title:</span>
                    <span className="team-card-value">{member.title}</span>
                  </div>
                  <div className="team-card-field">
                    <span className="team-card-label">Order:</span>
                    <span className="team-card-value">{member.order || 0}</span>
                  </div>
                  <div className="team-card-field">
                    <span className="team-card-label">Slug:</span>
                    <span className="team-card-value">{member.slug}</span>
                  </div>
                </div>
                <div className="team-card-actions">
                  <button onClick={() => handleEdit(member)} className="btn btn-small">Edit</button>
                  <button onClick={() => member._id && handleDelete(member._id)} className="btn btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
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
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .admin-form-content {
            width: 95%;
            padding: var(--spacing-md);
            max-height: 95vh;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-group input,
          .form-group textarea {
            min-height: 44px;
            font-size: 16px;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }
        }

        .admin-form-content h2 {
          margin-bottom: var(--spacing-md);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
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

        .admin-table-container {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .admin-table-container {
            padding: var(--spacing-xs);
            border-radius: 4px;
          }

          .team-card {
            padding: var(--spacing-xs);
          }
        }

        .admin-table-desktop {
          width: 100%;
          border-collapse: collapse;
        }

        .team-cards-mobile {
          display: none;
        }

        .admin-table-desktop th,
        .admin-table-desktop td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .admin-table-desktop th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .team-card {
          background: #fff;
          border: 1px solid var(--warm-grey-1);
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .team-card:last-child {
          margin-bottom: 0;
        }

        .team-card-content {
          margin-bottom: var(--spacing-md);
        }

        .team-card-field {
          display: flex;
          flex-direction: column;
          margin-bottom: var(--spacing-sm);
        }

        .team-card-field:last-child {
          margin-bottom: 0;
        }

        .team-card-label {
          font-weight: 600;
          color: var(--sbd-brown);
          font-size: 14px;
          margin-bottom: 0.25rem;
        }

        .team-card-value {
          color: var(--warm-grey-3);
          font-size: 16px;
        }

        .team-card-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .btn-small {
          padding: 0.75rem 1rem;
          font-size: 16px;
          min-height: 44px;
          width: 100%;
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        @media (max-width: 768px) {
          .admin-table-desktop {
            display: none;
          }

          .team-cards-mobile {
            display: block;
          }
        }

        .upload-status {
          color: var(--sbd-brown);
          margin-top: 0.5rem;
          font-size: 14px;
        }

        .image-preview {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
