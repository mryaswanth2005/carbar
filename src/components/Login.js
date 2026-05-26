'use client';
import React, { useState } from 'react';
import { Database, Lock, User, Loader2, ShieldCheck, Users } from 'lucide-react';

export default function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
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

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      const loggedInUser = result.user;
      
      // Enforce login type
      const role = (loggedInUser.Role || '').toLowerCase();
      if (loginType === 'admin' && role !== 'admin') {
        throw new Error('You do not have Administrator privileges.');
      }
      if (loginType === 'user' && role === 'admin') {
        throw new Error('Administrators must log in using the Admin Login portal.');
      }

      // Successful login
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium Decorative background elements */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, filter: 'blur(60px)'
      }} />

      <div style={{
        width: '100%', maxWidth: '440px', padding: '3rem',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 40px rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        zIndex: 1, backdropFilter: 'blur(20px)',
        position: 'relative'
      }}>
        
        {/* Header Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="CARBURE Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem' }} />
          <img src="/name.png" alt="CARBURE" style={{ height: '32px', objectFit: 'contain', marginBottom: '0.5rem' }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Welcome back! Please enter your details.</p>
        </div>

        {/* Login Type Toggle */}
        <div style={{ 
          display: 'flex', background: '#f1f5f9', borderRadius: '1rem', padding: '0.35rem', marginBottom: '2rem',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <button 
            type="button"
            onClick={() => { setLoginType('user'); setError(''); }}
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.875rem',
              background: loginType === 'user' ? 'white' : 'transparent',
              color: loginType === 'user' ? '#0f172a' : '#64748b',
              boxShadow: loginType === 'user' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Users size={18} /> User Login
          </button>
          <button 
            type="button"
            onClick={() => { setLoginType('admin'); setError(''); }}
            style={{ 
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '0.875rem',
              background: loginType === 'admin' ? 'white' : 'transparent',
              color: loginType === 'admin' ? '#0f172a' : '#64748b',
              boxShadow: loginType === 'admin' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={18} /> Admin Login
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem 1.25rem', background: '#fef2f2', color: '#ef4444', 
            borderRadius: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: '500',
            border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
          }}>
            <div style={{ marginTop: '0.125rem' }}><ShieldCheck size={16} /></div>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
              {loginType === 'admin' ? 'Admin ID / Email' : 'Employee ID / Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1.25rem', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={20} />
              </div>
              <input 
                type="text" 
                placeholder={loginType === 'admin' ? "admin@carbure.com" : "e.g. EMP001"} 
                style={{ 
                  width: '100%', padding: '0.875rem 1.25rem 0.875rem 3rem', height: '3.25rem',
                  fontSize: '1rem', color: '#0f172a', background: '#f8fafc', 
                  border: '1px solid #e2e8f0', borderRadius: '1rem', outline: 'none',
                  transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

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
                  transition: 'all 0.2s ease', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
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
              background: loginType === 'admin' ? 'linear-gradient(to right, #10b981, #059669)' : 'linear-gradient(to right, #3b82f6, #2563eb)',
              boxShadow: loginType === 'admin' ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={22} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : `Secure Sign In`}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
          Contact your system administrator for access
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
