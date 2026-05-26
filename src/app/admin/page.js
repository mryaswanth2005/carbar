'use client';
import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import AdminLogin from '@/components/AdminLogin';

export default function AdminPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Separate key — completely isolated from the user portal
    const savedAdmin = localStorage.getItem('carbure_admin_user');
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        // Guard: only allow actual admins on this page
        if (parsed?.Role?.toLowerCase() !== 'admin') {
          localStorage.removeItem('carbure_admin_user');
        } else {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem('carbure_admin_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('carbure_admin_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('carbure_admin_user');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('carbure_admin_user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
}
