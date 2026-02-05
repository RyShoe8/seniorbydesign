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
        setShowForm(false);
        setEditingResource(null);
        (e.target as HTMLFormElement).reset();
        await fetchResources();
      }
    } catch (error) {
          }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Resources & Links Management</h1>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingResource(null); 
          }} 
          className="btn add-resource-btn"
        >
          Add Resource
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal" onClick={handleCloseForm}>
          <div className="admin-form-content" onClick={(e) => e.stopPropagation()}>
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
                <button type="button" className="btn-secondary" onClick={handleCloseForm}>
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
                    <td className="note-cell">
                      {resource.note ? (
                        <div className="resource-note">{resource.note}</div>
                      ) : (
                        <span className="no-note">-</span>
                      )}
                    </td>
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
          
          <div className="resources-cards-mobile">
            {resources.map((resource) => (
              <div key={resource._id} className="resource-card">
                <div className="resource-card-content">
                  <div className="resource-card-field">
                    <span className="resource-card-label">Resource Name:</span>
                    <span className="resource-card-value">{resource.name}</span>
                  </div>
                  <div className="resource-card-field">
                    <span className="resource-card-label">Link:</span>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-card-link">
                      {resource.link}
                    </a>
                  </div>
                  <div className="resource-card-field">
                    <span className="resource-card-label">Note:</span>
                    {resource.note ? (
                      <div className="resource-card-note">{resource.note}</div>
                    ) : (
                      <span className="resource-card-no-note">-</span>
                    )}
                  </div>
                </div>
                <div className="resource-card-actions">
                  <button onClick={() => handleEdit(resource)} className="btn btn-small">Edit</button>
                  <button onClick={() => resource._id && handleDelete(resource._id)} className="btn btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .admin-page {
          position: relative;
          width: 100%;
          overflow-x: hidden;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          min-width: 0;
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
          max-width: 600px;
          width: 90%;
        }

        @media (max-width: 768px) {
          .admin-form-content {
            width: 95%;
            padding: var(--spacing-md);
            max-height: 95vh;
            overflow-y: auto;
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
          width: 100%;
          max-width: 100%;
        }

        .admin-table-desktop {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          min-width: 800px;
        }

        .resources-cards-mobile {
          display: none;
        }

        .admin-table-desktop th,
        .admin-table-desktop td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
          overflow: hidden;
          word-wrap: break-word;
          word-break: break-all;
        }

        .admin-table-desktop th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .admin-table-desktop th:nth-child(1) {
          width: 20%;
        }

        .admin-table-desktop th:nth-child(2) {
          width: 30%;
        }

        .admin-table-desktop th:nth-child(3) {
          width: 35%;
        }

        .admin-table-desktop th:nth-child(4) {
          width: 15%;
        }

        .admin-table-desktop a {
          color: var(--sbd-gold);
          text-decoration: underline;
          word-break: break-all;
          display: inline-block;
          max-width: 100%;
        }

        .note-cell {
          max-width: 100%;
          overflow: hidden;
        }

        .resource-note {
          background: var(--warm-grey-1);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--sbd-brown);
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
          display: block;
        }

        .no-note {
          color: var(--warm-grey-3);
          font-style: italic;
        }

        .resource-card {
          background: #fff;
          border: 1px solid var(--warm-grey-1);
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .resource-card:last-child {
          margin-bottom: 0;
        }

        .resource-card-content {
          margin-bottom: var(--spacing-md);
        }

        .resource-card-field {
          display: flex;
          flex-direction: column;
          margin-bottom: var(--spacing-sm);
        }

        .resource-card-field:last-child {
          margin-bottom: 0;
        }

        .resource-card-label {
          font-weight: 600;
          color: var(--sbd-brown);
          font-size: 14px;
          margin-bottom: 0.25rem;
        }

        .resource-card-value {
          color: var(--warm-grey-3);
          font-size: 16px;
          word-wrap: break-word;
        }

        .resource-card-link {
          color: var(--sbd-gold);
          text-decoration: underline;
          word-break: break-all;
          font-size: 16px;
        }

        .resource-card-note {
          background: var(--warm-grey-1);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--sbd-brown);
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .resource-card-no-note {
          color: var(--warm-grey-3);
          font-style: italic;
        }

        .resource-card-actions {
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

        @media (max-width: 768px) {
          .admin-table-desktop {
            display: none;
          }

          .resources-cards-mobile {
            display: block;
          }
        }

        .add-resource-btn {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .btn-danger {
          background: #dc3545;
        }
      `}</style>
    </div>
  );
}
