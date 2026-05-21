import React from 'react'

interface StatsGridProps {
  total: number;
  clients: number;
  saasCount: number;
  erpCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ total, clients, saasCount, erpCount }) => {
  const saasPercentage = clients > 0 ? ((saasCount / clients) * 100).toFixed(1) : '0';

  const stats = [
    {
      label: 'Total Active Tenants',
      value: total.toLocaleString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
      color: 'var(--accent-primary)',
    },
    {
      label: 'Academic Clients',
      value: clients.toLocaleString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      ),
      color: 'var(--accent-secondary)',
    },
    {
      label: 'SaaS Client Adoption',
      value: `${saasPercentage}%`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      ),
      color: 'var(--accent-success)',
    },
    {
      label: 'Active ERP Integrations',
      value: erpCount.toLocaleString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      color: 'var(--accent-warning)',
    },
  ];

  return (
    <div className="dashboard-grid animate-fade-in">
      {stats.map((stat, i) => (
        <div key={i} className="glass-card stat-card">
          <div 
            className="stat-icon-wrapper" 
            style={{ 
              backgroundColor: `hsl(${stat.color} / 0.1)`, 
              color: `hsl(${stat.color})` 
            }}
          >
            {stat.icon}
          </div>
          <div className="stat-info">
            <span className="stat-val">{stat.value}</span>
            <span className="stat-lbl">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
