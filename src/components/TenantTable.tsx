import React from 'react'

export interface Tenant {
  id: string;
  name: string;
  alias: string;
  label: string;
  accountId: string;
  website: string | null;
  region: string | null;
  account_type: string | null;
  erp_type: string | null;
  deployment_type: string | null;
  metadata?: {
    createdBy?: string;
    createdOn?: string;
    modifiedBy?: string;
    modifiedOn?: string;
    version?: string;
  };
}

interface TenantTableProps {
  tenants: Tenant[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSortChange: (field: string) => void;
  onTenantSelect: (tenant: Tenant) => void;
}

export const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  searchQuery,
  currentPage,
  pageSize,
  sortBy,
  sortOrder,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onTenantSelect,
}) => {

  // Helper to highlight matching search term
  const highlightText = (text: string | null, search: string) => {
    if (!text) return '—';
    if (!search.trim()) return text;
    
    try {
      const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, index) => 
        regex.test(part) 
          ? <span key={index} className="search-highlight">{part}</span> 
          : part
      );
    } catch (e) {
      return text;
    }
  };

  // Helper to render label badge
  const renderLabelBadge = (label: string | null) => {
    if (!label) return <span className="badge badge-muted">Default</span>;
    const l = label.toLowerCase();
    if (l.includes('prod')) return <span className="badge badge-green">Production</span>;
    if (l.includes('test')) return <span className="badge badge-purple">Test</span>;
    if (l.includes('stage')) return <span className="badge badge-orange">Stage</span>;
    if (l.includes('dev')) return <span className="badge badge-blue">Development</span>;
    return <span className="badge badge-teal">{label}</span>;
  };

  // Helper to render ERP badge
  const renderErpBadge = (erp: string | null) => {
    if (!erp || erp.toLowerCase() === 'none') {
      return <span className="badge badge-muted">Legacy / Custom</span>;
    }
    const e = erp.toLowerCase();
    if (e.includes('banner')) return <span className="badge badge-purple">Banner</span>;
    if (e.includes('colleague') || e.includes('collegue')) return <span className="badge badge-blue">Colleague</span>;
    if (e.includes('quercus')) return <span className="badge badge-teal">Quercus</span>;
    return <span className="badge badge-orange">{erp}</span>;
  };

  // Helper to render Deployment badge
  const renderDeploymentBadge = (dep: string | null) => {
    if (!dep || dep.toLowerCase() === 'none') {
      return <span className="badge badge-muted">OnPrem</span>;
    }
    const d = dep.toLowerCase();
    if (d.includes('saas')) return <span className="badge badge-green">SaaS</span>;
    if (d.includes('managed') || d.includes('cloud')) return <span className="badge badge-teal">Managed Cloud</span>;
    return <span className="badge badge-orange">{dep}</span>;
  };

  // Pagination calculation
  const totalRecords = tenants.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = tenants.slice(startIndex, startIndex + pageSize);

  const getSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  // Generate pagination buttons window (shows max 5 buttons)
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  // Export table data to CSV
const exportToCSV = (data: Tenant[], fileName: string) => {
    if (!data.length) return;
    // Collect all unique keys, including nested objects flattened as JSON strings
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(k => allKeys.add(k));
      // Include metadata keys if present
      if (item.metadata && typeof item.metadata === 'object') {
        Object.keys(item.metadata).forEach(k => allKeys.add(`metadata.${k}`));
      }
    });
    const headers = Array.from(allKeys);
    const rows = data.map(item => {
      const row: string[] = [];
      headers.forEach(h => {
        if (h.startsWith('metadata.')) {
          const metaKey = h.split('.')[1];
          const val = (item.metadata && (item.metadata as any)[metaKey]) ?? '';
          row.push(JSON.stringify(val));
        } else {
          const val = (item as any)[h] ?? '';
          // If value is an object, stringify it
          row.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : `${val}`);
        }
      });
      return row;
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
      
      {/* Table controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <h3 className="chart-title">Tenant Directory Listing ({totalRecords.toLocaleString()} Matches)</h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Display Size:</span>
          <select 
            className="select-field" 
            style={{ minWidth: '80px', padding: '6px 12px' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className="btn btn-primary" style={{ marginLeft: '12px' }} onClick={() => exportToCSV(tenants, 'tenants')}>Export CSV</button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
          <th className="sortable" onClick={() => onSortChange('id')}>ID{getSortIndicator('id')}</th>
              <th className="sortable" onClick={() => onSortChange('name')}>Name{getSortIndicator('name')}</th>
              <th className="sortable" onClick={() => onSortChange('alias')}>Alias{getSortIndicator('alias')}</th>
              <th className="sortable" onClick={() => onSortChange('label')}>Environment{getSortIndicator('label')}</th>
              <th className="sortable" onClick={() => onSortChange('erp_type')}>ERP Integration{getSortIndicator('erp_type')}</th>
              <th className="sortable" onClick={() => onSortChange('deployment_type')}>Infrastructure{getSortIndicator('deployment_type')}</th>
              <th className="sortable" onClick={() => onSortChange('region')}>Region{getSortIndicator('region')}</th>
              <th className="sortable" onClick={() => onSortChange('account_type')}>Classification{getSortIndicator('account_type')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTenants.length > 0 ? (
              paginatedTenants.map((tenant) => (
                <tr key={tenant.id} onClick={() => onTenantSelect(tenant)}>
                  <td>{tenant.id}</td>
                  <td style={{ fontWeight: 600, color: 'white' }}>
                    {highlightText(tenant.name, searchQuery)}
                  </td>
                  <td><code>{highlightText(tenant.alias, searchQuery)}</code></td>
                  <td>{renderLabelBadge(tenant.label)}</td>
                  <td>{renderErpBadge(tenant.erp_type)}</td>
                  <td>{renderDeploymentBadge(tenant.deployment_type)}</td>
                  <td>{highlightText(tenant.region, searchQuery)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    {highlightText(tenant.account_type, searchQuery)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  No matching university tenants found in directory database
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, totalRecords)}</strong> of <strong>{totalRecords.toLocaleString()}</strong> records
          </span>
          
          <div className="pagination-buttons">
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(1)} 
              disabled={currentPage === 1}
              title="First Page"
            >
              «
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              title="Previous Page"
            >
              ‹
            </button>
            
            {renderPaginationButtons()}
            
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              ›
            </button>
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(totalPages)} 
              disabled={currentPage === totalPages}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
