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
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user?.role !== 'admin') {
    return <div>Access denied. Admin only.</div>;
  }

  return (
    <div className="admin-page">
      <h1>User Management</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="users-table">
          <table>
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
                    <button className="btn-small">Edit</button>
                    <button className="btn-small btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .users-table {
          background: #fff;
          border-radius: 8px;
          padding: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: var(--spacing-sm);
          text-align: left;
          border-bottom: 1px solid var(--warm-grey-1);
        }

        th {
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


