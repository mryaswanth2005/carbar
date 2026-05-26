'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Loader2 } from 'lucide-react';
import AddAdminModal from './AddAdminModal';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [deletingRows, setDeletingRows] = useState({});

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admins');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch admins');
      }
      // Filter out anyone with 'admin' role
      const filteredAdmins = (result.data || []).filter(admin => (admin.Role || '').toLowerCase() !== 'admin');
      setAdmins(filteredAdmins);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleEdit = (admin) => {
    setAdminToEdit(admin);
    setIsModalOpen(true);
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    setDeletingRows({ ...deletingRows, [rowIndex]: true });

    try {
      const response = await fetch(`/api/admins?rowIndex=${rowIndex}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete admin');
      }
      
      await fetchAdmins();
    } catch (err) {
      alert(err.message);
    } finally {
      const newDeleting = { ...deletingRows };
      delete newDeleting[rowIndex];
      setDeletingRows(newDeleting);
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ padding: '0', borderBottom: 'none', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Employee Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage employee users and their access permissions</p>
        </div>
        <button className="primary-btn" onClick={() => { setAdminToEdit(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="loader-container" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading admins...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ minHeight: '300px' }}>
            <p>{error}</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="empty-state" style={{ minHeight: '300px' }}>
            <p>No admins found. Add one to get started.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee User</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => (
                <tr key={index} style={{ opacity: deletingRows[admin._rowIndex] ? 0.5 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>
                          {admin.Email || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          Added on {admin['Created At'] ? new Date(admin['Created At']).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{admin['Employee ID'] || '-'}</span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>{admin.Role || '-'}</span>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(admin.Permissions || '').split(',').slice(0, 2).map((p, i) => (
                         <span key={i} style={{ background: 'rgba(15, 23, 42, 0.05)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                           {p.trim()}
                         </span>
                      ))}
                      {(admin.Permissions || '').split(',').length > 2 && (
                         <span style={{ background: 'rgba(15, 23, 42, 0.05)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                           +{(admin.Permissions || '').split(',').length - 2} more
                         </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${(admin.Status || '').toLowerCase() === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {(admin.Status || 'Unknown').toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="icon-button" 
                        title="Edit"
                        onClick={() => handleEdit(admin)}
                        disabled={deletingRows[admin._rowIndex]}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-button" 
                        style={{ color: 'var(--danger)' }} 
                        title="Delete"
                        onClick={() => handleDelete(admin._rowIndex)}
                        disabled={deletingRows[admin._rowIndex]}
                      >
                        {deletingRows[admin._rowIndex] ? <Loader2 size={16} className="spinner" style={{width: 16, height: 16, borderWidth: 2, animationDuration: '0.5s'}} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <AddAdminModal 
          onClose={() => setIsModalOpen(false)} 
          onAdminAdded={fetchAdmins} 
          editAdmin={adminToEdit}
        />
      )}
    </div>
  );
}
