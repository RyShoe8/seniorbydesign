'use client';

import { useState, useEffect } from 'react';

interface Project {
  _id?: string;
  name: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export default function ProjectMapManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const zipCode = formData.get('zipCode') as string;
    
    const data = {
      name: formData.get('name') as string,
      zipCode: zipCode,
    };

    // Try to geocode zip code (simplified - in production, use a geocoding service)
    // For now, we'll just store the zip code and geocode can happen later

    try {
      const url = editingProject?._id 
        ? `/api/admin/projects/${editingProject._id}`
        : '/api/admin/projects';
      
      const response = await fetch(url, {
        method: editingProject?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchProjects();
        setShowForm(false);
        setEditingProject(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Project Map Management</h1>
        <button onClick={() => { setShowForm(true); setEditingProject(null); }} className="btn">
          Add Project
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingProject ? 'Edit' : 'Add'} Project</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Project Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={editingProject?.name || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  required
                  pattern="[0-9]{5}"
                  defaultValue={editingProject?.zipCode || ''}
                  placeholder="12345"
                />
                <small>5-digit US ZIP code</small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingProject(null); }}>
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
                <th>Project Name</th>
                <th>ZIP Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id}>
                  <td>{project.name}</td>
                  <td>{project.zipCode}</td>
                  <td>
                    <button onClick={() => handleEdit(project)} className="btn-small">Edit</button>
                    <button onClick={() => project._id && handleDelete(project._id)} className="btn-small btn-danger">
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

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: var(--warm-grey-3);
          font-size: 14px;
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
