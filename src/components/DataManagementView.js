'use client';
import React, { useState } from 'react';
import { Edit, Trash2, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function DataManagementView({ data, headers, onDataChanged, currentUser }) {
  const isAdmin = !currentUser || (currentUser.Role && currentUser.Role.toLowerCase() === 'admin');
  const accessPerms = currentUser && currentUser['Access Permissions'] ? currentUser['Access Permissions'] : '';
  const canEdit = isAdmin || accessPerms.includes('Write') || accessPerms.includes('Edit');
  const canDelete = isAdmin || accessPerms.includes('Delete');
  const showActionsColumn = canEdit || canDelete;
  const [editRowData, setEditRowData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination and Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const itemsPerPage = 4;

  const uniqueValues = React.useMemo(() => {
    if (!filterColumn) return [];
    return [...new Set(data.map(row => row[filterColumn]).filter(Boolean))].sort();
  }, [data, filterColumn]);

  const filteredData = React.useMemo(() => {
    let result = data;
    
    if (filterColumn && filterValue) {
      result = result.filter(row => row[filterColumn] === filterValue);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row => {
        return headers.some(h => {
          const val = row[h];
          return val && val.toString().toLowerCase().includes(lowerSearch);
        });
      });
    }
    
    return result;
  }, [data, searchTerm, headers, filterColumn, filterValue]);

  const handleDownloadFiltered = () => {
    if (filteredData.length === 0) return;
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    filteredData.forEach(item => {
      const row = headers.map(h => {
        let val = item[h];
        if (val === null || val === undefined) val = '';
        val = val.toString().replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'carbure_filtered_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleDelete = async (rowIndex) => {
    if (!confirm('Are you sure you want to permanently delete this row? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/sheet?rowIndex=${rowIndex}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert('Row deleted successfully');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert('Error deleting row: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData(e.target);
      const updates = {};

      headers.forEach(h => {
        updates[h] = formData.get(h);
      });

      const response = await fetch('/api/sheet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _rowIndex: editRowData._rowIndex,
          updates
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setIsEditModalOpen(false);
      setEditRowData(null);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert('Error updating row: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData(e.target);
      const dateHeader = headers.find(h => h.toLowerCase().includes('date'));
      const formDateRaw = dateHeader ? formData.get(dateHeader) : null;

      // Helper: normalise a date string to "DD-MM-YYYY" for consistent matching
      const normaliseDate = (str) => {
        if (!str) return null;
        // Already YYYY-MM-DD from date picker
        if (/^\d{4}-\d{2}-\d{2}$/.test(str.trim())) {
          const [y, m, d] = str.split('-');
          return `${d}-${m}-${y}`;
        }
        // Already DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(str.trim())) return str.trim();
        // Handle DD-Mon-YYYY or DD-Mon (26-May or 26-May-2026)
        const shortMonthMap = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
        const shortMonthRe = /^(\d{1,2})-([A-Za-z]{3})(?:-(\d{4}))?$/;
        const m2 = str.trim().match(shortMonthRe);
        if (m2) {
          const day = m2[1].padStart(2, '0');
          const month = shortMonthMap[m2[2].toLowerCase()] || '01';
          const year = m2[3] || new Date().getFullYear();
          return `${day}-${month}-${year}`;
        }
        // Fallback: try native Date parse
        const d2 = new Date(str);
        if (isNaN(d2)) return null;
        const dd = String(d2.getDate()).padStart(2,'0');
        const mm = String(d2.getMonth()+1).padStart(2,'0');
        return `${dd}-${mm}-${d2.getFullYear()}`;
      };

      let existingRow = null;
      if (formDateRaw) {
        const normForm = normaliseDate(formDateRaw);
        existingRow = normForm
          ? data.find(row => normaliseDate(row[dateHeader]) === normForm)
          : null;
      }

      if (existingRow && existingRow._rowIndex) {
        // Update existing record
        const updates = {};
        headers.forEach(h => {
          let val = formData.get(h) || '';
          // Convert YYYY-MM-DD to DD-MM-YYYY
          if (h.toLowerCase().includes('date') && val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const [y, m, d] = val.split('-');
            val = `${d}-${m}-${y}`;
          }
          if (val !== '') {
            updates[h] = val;
          }
        });

        const response = await fetch('/api/sheet', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _rowIndex: existingRow._rowIndex,
            updates
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update record');

        setIsAddModalOpen(false);
        alert('Existing record updated successfully!');
        if (onDataChanged) onDataChanged();
      } else {
        // Add new record
        const newRow = [];

        headers.forEach(h => {
          let val = formData.get(h) || '';
          // Convert YYYY-MM-DD to DD-MM-YYYY
          if (h.toLowerCase().includes('date') && val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const [y, m, d] = val.split('-');
            val = `${d}-${m}-${y}`;
          }
          newRow.push(val);
        });

        const response = await fetch('/api/sheet/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newRow })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to add record');

        setIsAddModalOpen(false);
        alert('Record added successfully!');
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      alert('Error adding row: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ padding: '0', borderBottom: 'none', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Data Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>View, edit, and delete your database records.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Advanced Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <select 
              value={filterColumn} 
              onChange={(e) => { setFilterColumn(e.target.value); setFilterValue(''); }}
              style={{ padding: '0.35rem 0.5rem', borderRadius: '0.25rem', border: 'none', background: 'transparent', color: 'var(--foreground)', outline: 'none', minWidth: '120px' }}
            >
              <option value="">Filter by column...</option>
              {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
            </select>
            {filterColumn && (
              <select 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ padding: '0.35rem 0.5rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--foreground)', outline: 'none', minWidth: '120px' }}
              >
                <option value="">All values</option>
                {uniqueValues.map((v, i) => <option key={i} value={v}>{v}</option>)}
              </select>
            )}
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <input 
              type="text" 
              placeholder="Search all columns..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 1rem', paddingLeft: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
            />
            <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', outline: 'none' }}
          >
            + Add Record
          </button>
          
          <button 
            onClick={handleDownloadFiltered} 
            disabled={filteredData.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem', outline: 'none' }}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="admin-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                {showActionsColumn && (
                  <th style={{ textAlign: 'left', whiteSpace: 'nowrap', width: '100px', paddingLeft: '1rem' }}>Actions</th>
                )}
                {headers.map((h, i) => (
                  <th key={i} style={{ whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((row, i) => (
                <tr key={i}>
                  {showActionsColumn && (
                    <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-start' }}>
                        {canEdit && (
                          <button className="icon-button" onClick={() => { setEditRowData(row); setIsEditModalOpen(true); }} title="Edit Row">
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="icon-button delete" onClick={() => handleDelete(row._rowIndex)} title="Delete Row">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {headers.map((h, colIdx) => (
                    <td key={colIdx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      {row[h] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={headers.length > 7 ? 9 : headers.length + 1} style={{ textAlign: 'center', padding: '3rem' }}>
                    {searchTerm ? 'No results found for your search' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--foreground)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--foreground)', margin: '0 0.5rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--foreground)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Data Modal */}
      {isEditModalOpen && editRowData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', borderRadius: '0.5rem' }}>
                  <Edit size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Edit Record</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Modifying row {editRowData._rowIndex}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => { setIsEditModalOpen(false); setEditRowData(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: 'var(--accent)', fontSize: '0.875rem' }}>
                You are only editing the columns you have permission to access. Any other columns in the Data Base will remain untouched.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {headers.map((h, i) => (
                  <div className="form-group" key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>{h}</label>
                    <input
                      type="text"
                      name={h}
                      className="form-input"
                      defaultValue={editRowData[h] || ''}
                      placeholder={`Enter ${h}`}
                      style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#f8fafc', transition: 'all 0.2s ease', outline: 'none' }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; e.target.style.background = 'white'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="secondary-btn" onClick={() => { setIsEditModalOpen(false); setEditRowData(null); }} disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600' }}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', borderRadius: '0.5rem' }}>
                  <Edit size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Add New Record</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Fill out the form below to append a new row to the database.</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {headers.map((h, i) => {
                  const isDate = h.toLowerCase().includes('date');
                  const today = new Date().toISOString().split('T')[0];
                  return (
                    <div key={i} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--foreground)' }}>{h}</label>
                      <input
                        type={isDate ? "date" : "text"}
                        name={h}
                        className="form-input"
                        placeholder={`Enter ${h}`}
                        min={isDate && !isAdmin ? today : undefined}
                        defaultValue={isDate ? today : undefined}
                        required={isDate}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: '#f8fafc', transition: 'all 0.2s ease', outline: 'none' }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; e.target.style.background = 'white'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="modal-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setIsAddModalOpen(false)} disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '600' }}>
                  {loading ? 'Adding...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
