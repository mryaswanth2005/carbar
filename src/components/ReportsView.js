'use client';
import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckSquare, Square } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsView({ data, headers }) {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      if (parts[2].length === 4) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  };

  const uniqueValues = React.useMemo(() => {
    if (!filterColumn || !data) return [];
    const vals = new Set();
    data.forEach(item => {
      if (item[filterColumn]) vals.add(item[filterColumn].toString());
    });
    return Array.from(vals).sort();
  }, [data, filterColumn]);

  const filteredData = React.useMemo(() => {
    let result = data || [];
    if (filterColumn && filterValue) {
      result = result.filter(item => item[filterColumn] && item[filterColumn].toString() === filterValue);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => headers.some(h => item[h] && item[h].toString().toLowerCase().includes(lowerSearch)));
    }
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      result = result.filter(item => {
        const dateHeader = headers.find(h => h.toLowerCase().includes('date'));
        if (!dateHeader || !item[dateHeader]) return false;
        const d = parseDate(item[dateHeader]);
        if (!d) return false;
        
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    return result;
  }, [data, searchTerm, headers, filterColumn, filterValue, startDate, endDate]);

  useEffect(() => {
    if (Array.isArray(headers) && headers.length > 0) {
      setSelectedColumns([...headers]); // default to all selected
    }
  }, [headers]);

  const toggleColumn = (col) => {
    if (!Array.isArray(selectedColumns)) return;
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const selectAll = () => setSelectedColumns(Array.isArray(headers) ? [...headers] : []);
  const deselectAll = () => setSelectedColumns([]);

  const handleDownloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to download.');
      return;
    }
    
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to include in the report.');
      return;
    }

    const doc = new jsPDF('landscape', 'pt', 'a3');
    doc.setFontSize(18);
    doc.text('CARBURE - Custom Report', 40, 40);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);
    
    const tableColumn = headers.filter(h => selectedColumns.includes(h));
    
    const sanitizeText = (text) => {
      if (text === null || text === undefined || text === '') return '-';
      return text.toString().replace(/₹/g, 'Rs. ');
    };

    const tableRows = filteredData.map(item => tableColumn.map(header => sanitizeText(item[header])));
    const dynamicFontSize = tableColumn.length > 15 ? 7 : (tableColumn.length > 10 ? 8 : 10);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      margin: { left: 40, right: 40 },
      styles: { 
        fontSize: dynamicFontSize, 
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    
    doc.save('carbure_custom_report.pdf');
  };

  const handleDownloadExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data available to download.');
      return;
    }
    
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to include in the report.');
      return;
    }

    const tableColumn = headers.filter(h => selectedColumns.includes(h));
    
    const csvRows = [];
    // Header
    csvRows.push(tableColumn.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    // Data
    filteredData.forEach(item => {
      const row = tableColumn.map(h => {
        let val = item[h];
        if (val === null || val === undefined) val = '';
        val = val.toString().replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    // Add UTF-8 BOM so Microsoft Excel renders currency symbols correctly
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'carbure_custom_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="admin-header" style={{ padding: '0', borderBottom: 'none', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--foreground)' }}>Custom Reports</h2>
          <p style={{ color: 'var(--text-muted)' }}>Select the specific columns you need and generate a PDF or Excel report.</p>
        </div>
      </div>

      <div className="admin-table-container" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Left Column: Selection Options & Filters */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--foreground)' }}>1. Filter Rows</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--background)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <select 
                  value={filterColumn} 
                  onChange={(e) => { setFilterColumn(e.target.value); setFilterValue(''); }}
                  style={{ padding: '0.35rem 0.5rem', borderRadius: '0.25rem', border: 'none', background: 'transparent', color: 'var(--foreground)', outline: 'none' }}
                >
                  <option value="">Filter by column...</option>
                  {headers.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </select>
                {filterColumn && (
                  <select 
                    value={filterValue} 
                    onChange={(e) => setFilterValue(e.target.value)}
                    style={{ padding: '0.35rem 0.5rem', borderRadius: '0.25rem', border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--foreground)', outline: 'none' }}
                  >
                    <option value="">All values</option>
                    {uniqueValues.map((v, i) => <option key={i} value={v}>{v}</option>)}
                  </select>
                )}
              </div>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <input 
                  type="text" 
                  placeholder="Search to filter..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 1rem', paddingLeft: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--background)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--foreground)' }}>2. Select Columns for Export</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button type="button" onClick={selectAll} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>Select All</button>
              <button type="button" onClick={deselectAll} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>Deselect All</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {Array.isArray(headers) && headers.map((header, index) => {
                const safeHeader = header || `Column_${index + 1}`;
                const isSelected = Array.isArray(selectedColumns) && selectedColumns.includes(safeHeader);
                return (
                  <div key={`${safeHeader}-${index}`} className={`permission-chip ${isSelected ? 'selected' : ''}`} onClick={() => toggleColumn(safeHeader)} style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={safeHeader}>{safeHeader}</span>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Download Action */}
          <div style={{ width: '300px', background: 'var(--background)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <FileText size={48} color="var(--accent)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>Custom Report</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Your report will include <strong>{selectedColumns.length}</strong> selected columns and <strong>{filteredData?.length || 0}</strong> rows of filtered data.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="primary-btn" onClick={handleDownloadPDF} style={{ width: '100%', justifyContent: 'center' }} disabled={!filteredData || filteredData.length === 0 || selectedColumns.length === 0}>
                <Download size={18} /> Download PDF
              </button>
              <button className="secondary-btn" onClick={handleDownloadExcel} style={{ width: '100%', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }} disabled={!filteredData || filteredData.length === 0 || selectedColumns.length === 0}>
                <Download size={18} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
