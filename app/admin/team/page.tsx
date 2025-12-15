'use client';

import { useState, useEffect } from 'react';

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
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
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
      console.error('Error deleting member:', error);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get('slug') as string,
      name: formData.get('name') as string,
      title: formData.get('title') as string,
      bio: formData.get('bio') as string,
      profileImage: formData.get('profileImage') as string,
      linkedin: formData.get('linkedin') as string,
      facebook: formData.get('facebook') as string,
      instagram: formData.get('instagram') as string,
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
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Team Management</h1>
        <button onClick={() => { setShowForm(true); setEditingMember(null); }} className="btn">
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
                <label htmlFor="profileImage">Profile Image URL</label>
                <input
                  type="url"
                  id="profileImage"
                  name="profileImage"
                  defaultValue={editingMember?.profileImage || ''}
                />
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
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingMember(null); }}>
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
                <th>Name</th>
                <th>Title</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.title}</td>
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

        .admin-table-container {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th,
        .admin-table td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .admin-table th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 14px;
          margin-right: 0.5rem;
        }

        .btn-danger {
          background: #dc3545;
        }
      `}</style>
    </div>
  );
}
