'use client';
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const PERMISSIONS_LIST = [
  'Date', 'IV NO', 'Party', 'Grade', 'CH.No', 
  'CHARCOAL (Kg)', 'CHARCOAL (Price)', 'MOISTURE', 'ACT.WT', 
  'INVOICE VALUE', 'Value for ACT WT', 'material wt diff', 
  'Bag wt', 'Total wt debit', 'Dust', 'DEBIT %'
];

export default function AddAdminModal({ onClose, onAdminAdded, editAdmin }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    role: 'staff',
    status: 'Active'
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState(['Dashboard']);
  const [selectedAccess, setSelectedAccess] = useState(['Read']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editAdmin) {
      setFormData({
        employeeId: editAdmin['Employee ID'] || '',
        email: editAdmin.Email || '',
        password: editAdmin.Password || '',
        role: editAdmin.Role || 'staff',
        status: editAdmin.Status || 'Active'
      });
      if (editAdmin.Permissions) {
        setSelectedPermissions(editAdmin.Permissions.split(',').map(p => p.trim()));
      }
      if (editAdmin['Access Permissions']) {
        setSelectedAccess(editAdmin['Access Permissions'].split(',').map(p => p.trim()));
      }
    }
  }, [editAdmin]);

  const toggleAccess = (acc) => {
    if (selectedAccess.includes(acc)) {
      setSelectedAccess(selectedAccess.filter(a => a !== acc));
    } else {
      setSelectedAccess([...selectedAccess, acc]);
    }
  };

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === PERMISSIONS_LIST.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([...PERMISSIONS_LIST]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = '/api/admins';
      const method = editAdmin ? 'PUT' : 'POST';
      const bodyPayload = {
        ...formData,
        permissions: selectedPermissions,
        accessPermissions: selectedAccess
      };
      
      if (editAdmin) {
        bodyPayload._rowIndex = editAdmin._rowIndex;
        bodyPayload.originalCreatedAt = editAdmin['Created At'];
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editAdmin ? 'update' : 'add'} admin`);
      }

      onAdminAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{editAdmin ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input 
                  type="text" 
                  name="employeeId"
                  className="form-input" 
                  placeholder="e.g., EMP001" 
                  value={formData.employeeId}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  className="form-input" 
                  placeholder="e.g., manager@carbure.com" 
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <input 
                  type="text" 
                  name="role"
                  className="form-input" 
                  placeholder="e.g., staff, Manager, IT" 
                  value={formData.role}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input 
                  type="password" 
                  name="password"
                  required
                  className="form-input" 
                  placeholder="Secure password" 
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input" value={formData.status} onChange={handleInputChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '16px', border: '1px solid currentColor', borderRadius: '3px', borderTopWidth: '4px' }}></span>
                Data Access Level
              </label>
              
              <div className="permissions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                {['Read', 'Write', 'Delete'].map(acc => {
                  const isSelected = selectedAccess.includes(acc);
                  return (
                    <div 
                      key={acc} 
                      className={`permission-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAccess(acc)}
                    >
                      <span>{acc}</span>
                      {isSelected ? <CheckCircle2 size={16} /> : <X size={16} />}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '16px', border: '1px solid currentColor', borderRadius: '3px', borderTopWidth: '4px' }}></span>
                  Allowed Columns (Headers)
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAllPermissions}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  {selectedPermissions.length === PERMISSIONS_LIST.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="permissions-grid">
                {PERMISSIONS_LIST.map(perm => {
                  const isSelected = selectedPermissions.includes(perm);
                  return (
                    <div 
                      key={perm} 
                      className={`permission-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => togglePermission(perm)}
                    >
                      <span>{perm}</span>
                      {isSelected ? <CheckCircle2 size={16} /> : <X size={16} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Saving...' : (editAdmin ? 'Save Changes' : '+ Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
