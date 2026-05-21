import React, { useState, useEffect } from 'react'
import { Tenant } from './TenantTable'

interface TenantDrawerProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export const TenantDrawer: React.FC<TenantDrawerProps> = ({ tenant, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Trigger animation delay for smooth slide-in
  useEffect(() => {
    if (tenant) {
      // Small timeout to allow backdrop overlay to initialize
      const t = setTimeout(() => setIsOpen(true), 10);
      return () => clearTimeout(t);
    } else {
      setIsOpen(false);
    }
  }, [tenant]);

  if (!tenant) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tenant, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Let animation finish before unmounting/clearing state in parent
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={handleClose}
      />
      
      {/* Slide-out Panel */}
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        
        {/* Header */}
        <div className="drawer-header">
          <div className="header-title-group">
            <h2 className="drawer-title">{tenant.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
              ID: {tenant.id}
            </span>
          </div>
          <button className="drawer-close" onClick={handleClose} title="Close Panel">
            &times;
          </button>
        </div>

        {/* Content list */}
        <div className="drawer-body">
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="drawer-section">
              <span className="drawer-label">Alias name</span>
              <span className="drawer-value"><code>{tenant.alias}</code></span>
            </div>
            
            <div className="drawer-section">
              <span className="drawer-label">Environment</span>
              <span className="drawer-value">{tenant.label || 'Default'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="drawer-section">
              <span className="drawer-label">ERP Integration</span>
              <span className="drawer-value">{tenant.erp_type || 'Legacy / Custom'}</span>
            </div>
            
            <div className="drawer-section">
              <span className="drawer-label">Deployment Type</span>
              <span className="drawer-value">{tenant.deployment_type || 'OnPrem'}</span>
            </div>
          </div>

          <div className="drawer-section">
            <span className="drawer-label">Academic Website</span>
            <span className="drawer-value">
              {tenant.website ? (
                <a href={tenant.website} target="_blank" rel="noopener noreferrer">
                  {tenant.website}
                </a>
              ) : 'Not Listed'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="drawer-section">
              <span className="drawer-label">Region / Territory</span>
              <span className="drawer-value">{tenant.region || 'Unspecified'}</span>
            </div>
            
            <div className="drawer-section">
              <span className="drawer-label">Account Classification</span>
              <span className="drawer-value">{tenant.account_type || 'Prospect'}</span>
            </div>
          </div>

          <div className="drawer-section">
            <span className="drawer-label">Salesforce Account ID</span>
            <span className="drawer-value" style={{ fontFamily: 'monospace' }}>
              {tenant.accountId || 'Internal System'}
            </span>
          </div>

          {/* Metadata Block */}
          {tenant.metadata && (
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span className="drawer-label" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                System Audit Trail & Metadata
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Created By</span>
                  <span style={{ color: 'white', wordBreak: 'break-all' }}>{tenant.metadata.createdBy || 'System Provisioning'}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Created On</span>
                  <span style={{ color: 'white' }}>{tenant.metadata.createdOn ? new Date(tenant.metadata.createdOn).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Modified By</span>
                  <span style={{ color: 'white', wordBreak: 'break-all' }}>{tenant.metadata.modifiedBy || 'System Provisioning'}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '2px' }}>Modified On</span>
                  <span style={{ color: 'white' }}>{tenant.metadata.modifiedOn ? new Date(tenant.metadata.modifiedOn).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                Database Record Version: <strong>{tenant.metadata.version || '1.0.0'}</strong>
              </div>
            </div>
          )}

          {/* Prettified JSON payload */}
          <div className="drawer-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="drawer-label">Prettified Database Object</span>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={handleCopyJson}>
                {copied ? '✓ Copied JSON' : '📋 Copy Object'}
              </button>
            </div>
            <pre className="raw-json-box">
              {JSON.stringify(tenant, null, 2)}
            </pre>
          </div>

        </div>

      </div>
    </>
  );
};
