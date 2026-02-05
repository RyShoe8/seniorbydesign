'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
}

export default function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword('');
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditEmail('');
    setEditRole('user');
    setEditPassword('');
    setShowAddForm(false);
    setNewEmail('');
    setNewRole('user');
    setNewPassword('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _id: editingUser._id,
            email: editEmail,
            role: editRole,
            password: editPassword || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Failed to update user');
          return;
        }
      } else {
        // Create new user
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newEmail,
            role: newRole,
            password: newPassword,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Failed to create user');
          return;
        }
      }

      await fetchUsers();
      handleCancel();
    } catch (error) {
      alert(editingUser ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      // Following established pattern - silent error handling
    }
  };

  if (session?.user?.role !== 'admin') {
    return <div>Access denied. Admin only.</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>User Management</h1>
        <button 
          onClick={() => {
            setShowAddForm(true);
            setEditingUser(null);
            setNewEmail('');
            setNewRole('user');
            setNewPassword('');
          }}
          className="btn"
        >
          Add User
        </button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="users-table">
            <table className="users-table-desktop">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button onClick={() => user._id && handleDelete(user._id)} className="btn-small btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="users-cards-mobile">
              {users.map((user) => (
                <div key={user._id} className="user-card">
                  <div className="user-card-content">
                    <div className="user-card-field">
                      <span className="user-card-label">Email:</span>
                      <span className="user-card-value">{user.email}</span>
                    </div>
                    <div className="user-card-field">
                      <span className="user-card-label">Role:</span>
                      <span className="user-card-value">{user.role}</span>
                    </div>
                  </div>
                  <div className="user-card-actions">
                    <button 
                      className="btn btn-small"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => user._id && handleDelete(user._id)} 
                      className="btn btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(editingUser || showAddForm) && (
            <div className="edit-form">
              <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser ? editEmail : newEmail}
                  onChange={(e) => editingUser ? setEditEmail(e.target.value) : setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={editingUser ? editRole : newRole}
                  onChange={(e) => editingUser ? setEditRole(e.target.value as 'admin' | 'user') : setNewRole(e.target.value as 'admin' | 'user')}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>{editingUser ? 'New Password (leave blank to keep current):' : 'Password:'}</label>
                <input
                  type="password"
                  value={editingUser ? editPassword : newPassword}
                  onChange={(e) => editingUser ? setEditPassword(e.target.value) : setNewPassword(e.target.value)}
                  placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                  required={!editingUser}
                />
              </div>
              <div className="form-actions">
                <button 
                  className="btn"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingUser ? 'Save' : 'Create'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
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

        .users-table {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        @media (max-width: 768px) {
          .users-table {
            padding: var(--spacing-xs);
            border-radius: 4px;
          }

          .user-card {
            padding: var(--spacing-xs);
          }

          .user-card-content {
            margin-bottom: var(--spacing-xs);
          }

          .user-card-field {
            margin-bottom: var(--spacing-xs);
          }

          .user-card-label {
            margin-bottom: 0.125rem;
          }
        }

        .users-table-desktop {
          width: 100%;
          border-collapse: collapse;
        }

        .users-cards-mobile {
          display: none;
        }

        .users-table-desktop th,
        .users-table-desktop td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        .users-table-desktop th {
          font-weight: 600;
          color: var(--sbd-brown);
        }

        .user-card {
          background: #fff;
          border: 1px solid var(--warm-grey-1);
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .user-card:last-child {
          margin-bottom: 0;
        }

        .user-card-content {
          margin-bottom: var(--spacing-md);
        }

        .user-card-field {
          display: flex;
          flex-direction: column;
          margin-bottom: var(--spacing-sm);
        }

        .user-card-field:last-child {
          margin-bottom: 0;
        }

        .user-card-label {
          font-weight: 600;
          color: var(--sbd-brown);
          font-size: 14px;
          margin-bottom: 0.25rem;
        }

        .user-card-value {
          color: var(--warm-grey-3);
          font-size: 16px;
        }

        .user-card-actions {
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
          .users-table-desktop {
            display: none;
          }

          .users-cards-mobile {
            display: block;
          }
        }

        .btn-danger {
          background: #dc3545;
          color: #fff;
        }

        .edit-form {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-xl);
          margin-top: var(--spacing-md);
        }

        .edit-form h2 {
          margin-bottom: var(--spacing-md);
          color: var(--sbd-brown);
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

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--warm-grey-3);
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
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

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-header .btn {
            width: 100%;
          }

          .edit-form {
            padding: var(--spacing-xs);
            border-radius: 4px;
          }

          .form-group input,
          .form-group select {
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
      `}</style>
    </div>
  );
}




