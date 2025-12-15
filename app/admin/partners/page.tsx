'use client';

import { useState, useEffect } from 'react';

interface Partner {
  _id?: string;
  name: string;
  logo: string;
  url?: string;
  order: number;
}

export default function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/partners');
      const data = await response.json();
      setPartners(data.sort((a: Partner, b: Partner) => a.order - b.order));
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchPartners();
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      logo: formData.get('logo') as string,
      url: formData.get('url') as string,
      order: parseInt(formData.get('order') as string) || 0,
    };

    try {
      const url = editingPartner?._id 
        ? `/api/admin/partners/${editingPartner._id}`
        : '/api/admin/partners';
      
      const response = await fetch(url, {
        method: editingPartner?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchPartners();
        setShowForm(false);
        setEditingPartner(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error saving partner:', error);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Partners Management</h1>
        <button onClick={() => { setShowForm(true); setEditingPartner(null); }} className="btn">
          Add Partner
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="admin-form-content">
            <h2>{editingPartner ? 'Edit' : 'Add'} Partner</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="name">Partner Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={editingPartner?.name || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="logo">Logo URL *</label>
                <input
                  type="url"
                  id="logo"
                  name="logo"
                  required
                  defaultValue={editingPartner?.logo || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="url">Website URL (optional)</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  defaultValue={editingPartner?.url || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="order">Display Order</label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  defaultValue={editingPartner?.order || partners.length}
                  min="0"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingPartner(null); }}>
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
                <th>Logo</th>
                <th>URL</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner._id}>
                  <td>{partner.name}</td>
                  <td>
                    {partner.logo && (
                      <img src={partner.logo} alt={partner.name} style={{ maxWidth: '100px', maxHeight: '50px' }} />
                    )}
                  </td>
                  <td>{partner.url || '-'}</td>
                  <td>{partner.order}</td>
                  <td>
                    <button onClick={() => handleEdit(partner)} className="btn-small">Edit</button>
                    <button onClick={() => partner._id && handleDelete(partner._id)} className="btn-small btn-danger">
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
