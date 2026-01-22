'use client';

import { useState, useEffect } from 'react';
import PortfolioMap from '@/components/PortfolioMap';

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

  const handleGeocodeAll = async () => {
    if (!confirm('This will geocode all projects with ZIP codes but no coordinates. This may take a few minutes. Continue?')) return;
    
    try {
      const response = await fetch('/api/admin/projects/geocode', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Geocoding complete! ${data.geocoded} projects geocoded, ${data.failed} failed.`);
        fetchProjects();
      } else {
        alert('Error geocoding projects');
      }
    } catch (error) {
      console.error('Error geocoding projects:', error);
      alert('Error geocoding projects');
    }
  };

  const handleClearGeocode = async (id: string) => {
    if (!confirm('Clear geocoding coordinates for this project? You can re-geocode it later.')) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearGeocode' }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Geocoding cleared successfully');
        fetchProjects();
      } else {
        alert(data.error || 'Error clearing geocoding');
      }
    } catch (error) {
      console.error('Error clearing geocoding:', error);
      alert('Error clearing geocoding');
    }
  };

  const handleRegeocode = async (id: string) => {
    if (!confirm('Re-geocode this project? This will clear existing coordinates and fetch new ones.')) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regeocode' }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Project re-geocoded successfully');
        fetchProjects();
      } else {
        alert(data.error || 'Error re-geocoding project');
      }
    } catch (error) {
      console.error('Error re-geocoding:', error);
      alert('Error re-geocoding project');
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
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    
    const data: {
      name: string;
      zipCode: string;
      latitude?: number;
      longitude?: number;
    } = {
      name: formData.get('name') as string,
      zipCode: zipCode,
    };

    // If manual coordinates are provided, use them instead of geocoding
    if (latitudeStr && longitudeStr) {
      const lat = parseFloat(latitudeStr);
      const lng = parseFloat(longitudeStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        data.latitude = lat;
        data.longitude = lng;
      }
    }

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
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={handleGeocodeAll} className="btn-secondary">
            Geocode All Projects
          </button>
          <button onClick={() => { setShowForm(true); setEditingProject(null); }} className="btn">
            Add Project
          </button>
        </div>
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
              <div className="form-group">
                <label htmlFor="latitude">Latitude (optional - manual override)</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  step="any"
                  defaultValue={editingProject?.latitude?.toString() || ''}
                  placeholder="29.7604"
                />
                <small>Leave empty to auto-geocode from ZIP code. Use if geocoding returns incorrect location.</small>
              </div>
              <div className="form-group">
                <label htmlFor="longitude">Longitude (optional - manual override)</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  step="any"
                  defaultValue={editingProject?.longitude?.toString() || ''}
                  placeholder="-95.3698"
                />
                <small>Leave empty to auto-geocode from ZIP code. Use if geocoding returns incorrect location.</small>
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
        <>
          {projects.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Project Map Preview</h2>
              <PortfolioMap projects={projects.map(p => ({ ...p, _id: p._id?.toString() }))} />
            </div>
          )}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>ZIP Code</th>
                  <th>Coordinates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>{project.name}</td>
                    <td>{project.zipCode}</td>
                    <td>
                      {project.latitude && project.longitude ? (
                        <span style={{ fontSize: '12px', color: 'var(--warm-grey-3)' }}>
                          {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#dc3545' }}>Not geocoded</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={() => handleEdit(project)} className="btn-small">Edit</button>
                        {project.latitude && project.longitude ? (
                          <>
                            <button 
                              onClick={() => project._id && handleClearGeocode(project._id)} 
                              className="btn-small"
                              style={{ backgroundColor: '#ffc107', color: '#000' }}
                            >
                              Clear Geocode
                            </button>
                            <button 
                              onClick={() => project._id && handleRegeocode(project._id)} 
                              className="btn-small"
                              style={{ backgroundColor: '#17a2b8', color: '#fff' }}
                            >
                              Re-geocode
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => project._id && handleRegeocode(project._id)} 
                            className="btn-small"
                            style={{ backgroundColor: '#28a745', color: '#fff' }}
                          >
                            Geocode
                          </button>
                        )}
                        <button onClick={() => project._id && handleDelete(project._id)} className="btn-small btn-danger">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
