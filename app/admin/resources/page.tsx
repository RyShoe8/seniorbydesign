'use client';

import { useState, useEffect } from 'react';

interface Resource {
  _id?: string;
  name: string;
  link: string;
  note?: string;
}

export default function ResourcesManagement() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/admin/resources');
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const response = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchResources();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      link: formData.get('link') as string,
      note: formData.get('note') as string,
    };

    try {
      const url = editingResource?._id 
        ? `/api/admin/resources/${editingResource._id}`
        : '/api/admin/resources';
      
      const response = await fetch(url, {
        method: editingResource?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchResources();
        setShowForm(false);
        setEditingResource(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Resources & Links Management</h1>
        <button onClick={() => { setShowForm(true); setEditingResource(null); }} className="btn">
          Add Resource
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingResource ? 'Edit' : 'Add'} Resource</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Resource Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={editingResource?.name || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="link">Resource Link *</label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  required
                  defaultValue={editingResource?.link || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="note">Note</label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  defaultValue={editingResource?.note || ''}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingResource(null); }}>
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
                <th>Resource Name</th>
                <th>Link</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource._id}>
                  <td>{resource.name}</td>
                  <td>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      {resource.link}
                    </a>
                  </td>
                  <td>{resource.note || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(resource)} className="btn-small">Edit</button>
                    <button onClick={() => resource._id && handleDelete(resource._id)} className="btn-small btn-danger">
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
          max-width: 600px;
          width: 90%;
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

        .admin-table a {
          color: var(--sbd-gold);
          text-decoration: underline;
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
