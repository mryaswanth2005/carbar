'use client';
import React, { useState } from 'react';
import { User, Lock, Mail, Loader2, Save } from 'lucide-react';

export default function SettingsView({ currentUser, onUpdateUser }) {
  const [formData, setFormData] = useState({
    employeeId: currentUser['Employee ID'] || '',
    email: currentUser.Email || '',
    password: '', // we don't pre-fill password for security
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // If password isn't filled out, we keep the original one (which isn't stored in currentUser natively)
    // Oh wait, if we call PUT /api/admins, it needs all fields.
    // The `currentUser` doesn't have the password.
    // Let's modify the payload. The PUT API needs the password if it's going to overwrite the row.
    // If we don't have the password, we'll tell the user they MUST enter a new password (or their current one) to save changes.
    if (!formData.password) {
      setError('Please enter a password to confirm your changes.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        _rowIndex: currentUser._rowIndex,
        originalCreatedAt: currentUser['Created At'],
        employeeId: formData.employeeId,
        email: formData.email,
        password: formData.password,
        role: currentUser.Role,
        status: currentUser.Status,
        permissions: currentUser.Permissions
      };

      const response = await fetch('/api/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setMessage('Your profile has been updated successfully!');
      
      // Update local storage and current user state
      const updatedUser = { ...currentUser, 'Employee ID': formData.employeeId, Email: formData.email };
      onUpdateUser(updatedUser);
      
      // Clear password field
      setFormData({ ...formData, password: '' });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* My Access Banner */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--foreground)' }}>My Current Access</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Below are the specific data columns and features your Administrator has granted you access to view and edit.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {currentUser?.Role?.toLowerCase() === 'admin' ? (
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--success)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '999px', 
              fontSize: '0.875rem', 
              fontWeight: '500',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              Full Administrator Access (All Columns & Features)
            </span>
          ) : (
            (currentUser?.Permissions || 'None').split(',').filter(Boolean).map((p, i) => (
              <span key={i} style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--accent)', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '999px', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                {p.trim()}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="admin-header" style={{ padding: '0', borderBottom: 'none', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Account Settings</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal account credentials</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', background: 'var(--card-bg)', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', padding: '2rem' }}>
        
        {message && (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '4px', height: '100%', background: 'var(--success)', borderRadius: '2px' }} />
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '4px', height: '100%', background: 'var(--danger)', borderRadius: '2px' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Employee ID</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                name="employeeId"
                className="form-input" 
                style={{ paddingLeft: '2.75rem' }}
                value={formData.employeeId}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                className="form-input" 
                style={{ paddingLeft: '2.75rem' }}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
          
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Security</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            To save your changes or update your password, please enter a new password (or your current one).
          </p>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                name="password"
                className="form-input" 
                placeholder="Enter password to confirm changes"
                style={{ paddingLeft: '2.75rem' }}
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-btn" 
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
