'use client';
import React, { useState } from 'react';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed');

      const loggedInUser = result.user;
      const role = (loggedInUser.Role || '').toLowerCase();

      // Block non-admins — they must use /
      if (role !== 'admin') {
        throw new Error('This portal is for Administrators only. Please use the Employee Portal instead.');
      }

      onLogin(loggedInUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfdf5 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative blobs — green theme */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, filter: 'blur(60px)'
      }} />

      <div style={{
        width: '100%', maxWidth: '440px', margin: '1rem',
        padding: '3rem',
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 40px rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        zIndex: 1, backdropFilter: 'blur(20px)',
        position: 'relative'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="CARBURE Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem' }} />
          <img src="/name.png" alt="CARBURE" style={{ height: '32px', objectFit: 'contain', marginBottom: '0.5rem' }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 1rem', background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '2rem', border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#059669', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem'
          }}>
            <ShieldCheck size={14} /> Admin Portal
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Restricted access — administrators only.</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem 1.25rem', background: '#fef2f2', color: '#ef4444',
            borderRadius: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: '500',
            border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
          }}>
            <div>⚠</div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Identifier */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
              Admin ID / Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={20} />
              </div>
              <input
                type="text"
                placeholder="admin@carbure.com"
                style={{
                  width: '100%', padding: '0.875rem 1.25rem 0.875rem 3rem', height: '3.25rem',
                  fontSize: '1rem', color: '#0f172a', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '1rem', outline: 'none',
                  transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.875rem 1.25rem 0.875rem 3rem', height: '3.25rem',
                  fontSize: '1rem', color: '#0f172a', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '1rem', outline: 'none',
                  transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%', height: '3.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: '600', color: 'white', border: 'none', borderRadius: '1rem',
              background: 'linear-gradient(to right, #10b981, #059669)',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.35)',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease'
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> : 'Admin Sign In'}
          </button>
        </form>

        {/* Link back to user portal */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Not an admin?{' '}
          <a href="/" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
            Go to Employee Portal →
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
