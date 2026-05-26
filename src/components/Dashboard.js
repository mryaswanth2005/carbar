'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { LayoutDashboard, Users, FileText, Settings, Bell, Search, Menu, Database } from 'lucide-react';
import AdminManagement from './AdminManagement';
import ReportsView from './ReportsView';
import DataManagementView from './DataManagementView';
import SettingsView from './SettingsView';
import { LogOut } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const GRADIENTS = [
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#047857'],
  ['#f59e0b', '#b45309'],
  ['#ef4444', '#b91c1c'],
  ['#8b5cf6', '#6d28d9'],
  ['#ec4899', '#be185d'],
];

// Main Layout Component
export default function Dashboard({ currentUser, onLogout, onUpdateUser }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Force legacy sessions to log out so they get the new _rowIndex property
    if (currentUser && !currentUser._rowIndex) {
      onLogout();
      return;
    }
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sheet');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result.data || []);
      setHeaders(result.headers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canViewAdmins = !currentUser || (currentUser.Role && currentUser.Role.toLowerCase() === 'admin');

  // Filter headers based on current user permissions
  const displayHeaders = React.useMemo(() => {
    if (canViewAdmins) return headers;
    if (!currentUser || !currentUser.Permissions) return headers;
    const allowed = currentUser.Permissions.split(',').map(p => p.trim());
    return headers.filter(h => allowed.includes(h) || h.toLowerCase() === 'date' || allowed.includes('Dashboard'));
  }, [headers, currentUser, canViewAdmins]);

  const displayData = React.useMemo(() => {
    if (canViewAdmins) return data;
    if (!currentUser || !currentUser.Permissions) return data;
    return data.map(row => {
      const newRow = {};
      displayHeaders.forEach(h => newRow[h] = row[h]);
      newRow._rowIndex = row._rowIndex; // Ensure row index is preserved for edits
      return newRow;
    });
  }, [data, displayHeaders, currentUser, canViewAdmins]);

  // Determine what type of data we have to show some KPI stats
  const rowCount = displayData.length;
  const colCount = displayHeaders.length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
          <img src="/name.png" alt="CARBURE" style={{ height: '48px', objectFit: 'contain', marginTop: '4px' }} />
        </div>
        <nav className="nav-links">
          <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          {canViewAdmins && (
            <div className={`nav-item ${activeView === 'users' ? 'active' : ''}`} onClick={() => setActiveView('users')}>
              <Users size={20} />
              <span>Employees</span>
            </div>
          )}
          <div className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} onClick={() => setActiveView('reports')}>
            <FileText size={20} />
            <span>PDF Reports</span>
          </div>
          <div className={`nav-item ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>
            <Database size={20} />
            <span>Data</span>
          </div>
          {canViewAdmins && (
            <div className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')} style={{ marginTop: 'auto' }}>
              <Settings size={20} />
              <span>Settings</span>
            </div>
          )}
          <div className="nav-item" onClick={onLogout} style={{ color: 'var(--danger)', marginTop: '0.5rem', cursor: 'pointer' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">Admin Overview</div>
          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Logged in as <strong style={{ color: 'var(--foreground)' }}>{currentUser?.Email}</strong></span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeView === 'settings' && canViewAdmins ? (
            <SettingsView currentUser={currentUser} onUpdateUser={onUpdateUser} />
          ) : activeView === 'users' && canViewAdmins ? (
            <AdminManagement />
          ) : activeView === 'reports' ? (
            <ReportsView data={displayData} headers={displayHeaders} />
          ) : activeView === 'data' ? (
            <DataManagementView data={displayData} headers={displayHeaders} onDataChanged={refreshData} currentUser={currentUser} />
          ) : loading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <p>Loading your data...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <Database size={48} />
              <h3>Oops! Something went wrong.</h3>
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <Database size={48} />
              <h3>No data found</h3>
              <p>The connected Google Sheet appears to be empty.</p>
            </div>
          ) : (
            <>
              {/* KPI Summary Strip */}
              {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="kpi-card">
                  <div className="kpi-header"><span>Total Records</span></div>
                  <div className="kpi-value">{rowCount}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-header"><span>Total Columns</span></div>
                  <div className="kpi-value">{colCount}</div>
                </div>
                {displayHeaders.filter(h => {
                  const upper = h.toUpperCase();
                  if (upper.includes('NO') && !upper.includes('PRICE') && !upper.includes('WT')) return false;
                  return data.some(row => {
                    const val = row[h];
                    if (!val) return false;
                    return !isNaN(parseFloat(String(val).replace(/,/g, '')));
                  });
                }).slice(0, 2).map((h, i) => {
                  const total = data.reduce((sum, row) => {
                    const v = parseFloat(String(row[h] || '0').replace(/,/g, ''));
                    return sum + (isNaN(v) ? 0 : v);
                  }, 0);
                  return (
                    <div key={i} className="kpi-card">
                      <div className="kpi-header"><span>{h}</span></div>
                      <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{total.toLocaleString('en-IN')}</div>
                    </div>
                  );
                })}
              </div> */}

              {/* Charts Section */}
              <div className="charts-grid">
                <ChartWidget data={displayData} headers={displayHeaders} type="bar" title="Overview Report" isAdmin={canViewAdmins} />
                <ChartWidget data={displayData} headers={displayHeaders} type="line" title="Trend Analysis" isAdmin={canViewAdmins} />
                <ChartWidget data={displayData} headers={displayHeaders} type="area" title="Volume Distribution" isAdmin={canViewAdmins} />
                <ChartWidget data={displayData} headers={displayHeaders} type="pie" title="Proportions" isAdmin={canViewAdmins} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Chart Widget Component to dynamically render charts based on headers
function ChartWidget({ data, headers, type, title, isAdmin }) {
  const numericHeaders = headers.filter(header => {
    const upper = header.toUpperCase();
    if (upper.includes('NO') && !upper.includes('PRICE') && !upper.includes('WT')) return false;
    return data.some(row => {
      const val = row[header];
      if (!val) return false;
      return !isNaN(parseFloat(String(val).replace(/,/g, '')));
    });
  });

  const uniqueNumeric = Array.from(new Set(numericHeaders));
  const dateHeader = headers.find(h => h.toLowerCase().includes('date'));
  const xKey = dateHeader || headers[0];

  // Admin column selector state
  const [selectedCols, setSelectedCols] = React.useState(null);
  const activeCols = selectedCols || (uniqueNumeric.length > 0 ? uniqueNumeric.slice(0, 3) : [headers[1]].filter(Boolean));

  const chartData = React.useMemo(() => {
    return data.map(item => {
      const newItem = { ...item };
      activeCols.forEach(key => {
        if (newItem[key] !== undefined) {
          const parsed = parseFloat(String(newItem[key]).replace(/,/g, ''));
          newItem[key] = isNaN(parsed) ? 0 : parsed;
        }
      });
      return newItem;
    });
  }, [data, activeCols]);

  const toggleCol = (col) => {
    setSelectedCols(prev => {
      const cur = prev || uniqueNumeric.slice(0, 3);
      if (cur.includes(col)) return cur.length > 1 ? cur.filter(c => c !== col) : cur;
      return [...cur, col];
    });
  };

  if (!data || data.length === 0 || !headers || headers.length < 2) {
    return (
      <div className="chart-card">
        <h3 className="chart-header">{title}</h3>
        <div className="empty-state" style={{ minHeight: '300px' }}>
          <p>Not enough data for charts.</p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: { background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '0.75rem' },
    itemStyle: { color: 'var(--foreground)', fontWeight: '500' },
    labelStyle: { color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }} barSize={28}>
              <defs>
                {activeCols.map((key, i) => (
                  <linearGradient key={key} id={`grad-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GRADIENTS[i % GRADIENTS.length][0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={GRADIENTS[i % GRADIENTS.length][1]} stopOpacity={0.8} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
              {activeCols.map((key, index) => (
                <Bar key={`${key}-${index}`} dataKey={key} fill={`url(#grad-bar-${index})`} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
              {activeCols.map((key, index) => (
                <Line key={`${key}-${index}`} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ r: 5, fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <defs>
                {activeCols.map((key, i) => (
                  <linearGradient key={key} id={`grad-area-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
              {activeCols.map((key, index) => (
                <Area key={`${key}-${index}`} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={3} fill={`url(#grad-area-${index})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        const pieKey = activeCols[0];
        const pieDataMap = {};
        chartData.forEach(item => {
          const cat = item[xKey] || 'Unknown';
          const val = parseFloat(item[pieKey]) || 1;
          pieDataMap[cat] = (pieDataMap[cat] || 0) + val;
        });
        const pieData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] })).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="chart-header" style={{ margin: 0 }}>{title}</h3>
        {isAdmin && uniqueNumeric.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {uniqueNumeric.slice(0, 6).map(col => (
              <button
                key={col}
                onClick={() => toggleCol(col)}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '2rem',
                  border: `1.5px solid ${activeCols.includes(col) ? COLORS[uniqueNumeric.indexOf(col) % COLORS.length] : 'var(--border-color)'}`,
                  background: activeCols.includes(col) ? `${COLORS[uniqueNumeric.indexOf(col) % COLORS.length]}18` : 'transparent',
                  color: activeCols.includes(col) ? COLORS[uniqueNumeric.indexOf(col) % COLORS.length] : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {col}
              </button>
            ))}
          </div>
        )}
      </div>
      {renderChart()}
    </div>
  );
}

