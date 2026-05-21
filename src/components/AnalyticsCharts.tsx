import React from 'react'

interface ChartItem {
  name: string;
  count: number;
}

interface AnalyticsChartsProps {
  erpData: ChartItem[];
  deploymentData: ChartItem[];
  regionData: ChartItem[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ erpData, deploymentData, regionData }) => {
  // 1. ERP Type percentages
  const maxErp = Math.max(...erpData.map(d => d.count), 1);

  // 2. Region Distribution percentages (Top Regions)
  const maxRegion = Math.max(...regionData.map(d => d.count), 1);

  // 3. Deployment Types calculation for Custom Donut Chart (SVG)
  const totalDeployments = deploymentData.reduce((sum, item) => sum + item.count, 0);
  
  // Custom colors for Donut slices
  const sliceColors = [
    'var(--accent-primary)',
    'var(--accent-secondary)',
    'var(--accent-success)',
    'var(--accent-warning)',
    'var(--accent-info)',
  ];

  // SVG Donut calculation
  let accumulatedAngle = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const donutSlices = deploymentData.map((item, index) => {
    const percentage = totalDeployments > 0 ? item.count / totalDeployments : 0;
    const strokeLength = percentage * circumference;
    const strokeOffset = circumference - strokeLength + accumulatedAngle;
    accumulatedAngle -= strokeLength; // Keep rotating
    
    return {
      ...item,
      percentage,
      strokeLength,
      strokeOffset,
      color: sliceColors[index % sliceColors.length]
    };
  });

  return (
    <div className="charts-grid animate-fade-in" style={{ animationDelay: '0.1s', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
      
      {/* ERP Distribution Bar Chart */}
      <div className="glass-card chart-container">
        <div className="chart-header">
          <h3 className="chart-title">ERP Technology Distribution</h3>
        </div>
        <div className="chart-wrapper">
          <div className="bar-chart-list">
            {erpData.map((item) => {
              const widthPercentage = (item.count / maxErp) * 100;
              return (
                <div key={item.name} className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span className="bar-chart-name">{item.name === 'None' || !item.name ? 'Unspecified ERP' : item.name}</span>
                    <span className="bar-chart-count">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="bar-chart-track">
                    <div 
                      className="bar-chart-fill" 
                      style={{ 
                        width: `${widthPercentage}%`,
                        background: item.name === 'Banner' 
                          ? 'linear-gradient(90deg, hsl(262 80% 60%) 0%, hsl(214 100% 55%) 100%)' 
                          : item.name === 'Colleague' 
                            ? 'linear-gradient(90deg, hsl(214 100% 55%) 0%, hsl(185 85% 45%) 100%)' 
                            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.25) 100%)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deployment Mode Donut Chart */}
      <div className="glass-card chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Deployment Infrastructure</h3>
        </div>
        <div className="chart-wrapper" style={{ flexDirection: 'column', gap: '20px' }}>
          {totalDeployments > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%', flexWrap: 'wrap', gap: '24px' }}>
              
              {/* SVG Donut Circle */}
              <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                {donutSlices.map((slice) => (
                  <circle
                    key={slice.name}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={`hsl(${slice.color})`}
                    strokeWidth="18"
                    strokeDasharray={`${slice.strokeLength} ${circumference}`}
                    strokeDashoffset={slice.strokeOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                ))}
                {/* Center cutout */}
                <circle cx="70" cy="70" r="36" fill="#09090b" />
                <text 
                  x="70" 
                  y="-70" 
                  transform="rotate(90)" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill="white" 
                  style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '14px' }}
                >
                  Adopted
                </text>
              </svg>

              {/* Legend List */}
              <div className="pie-chart-legend">
                {donutSlices.map((slice) => (
                  <div key={slice.name} className="legend-item">
                    <span 
                      className="legend-dot" 
                      style={{ backgroundColor: `hsl(${slice.color})` }}
                    />
                    <span style={{ fontWeight: 600, color: 'white' }}>
                      {((slice.percentage) * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: 'hsl(var(--text-muted))' }}>
                      {slice.name === 'None' || !slice.name ? 'Legacy' : slice.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span style={{ color: 'hsl(var(--text-muted))' }}>No deployment data available</span>
          )}
        </div>
      </div>

      {/* Top Academic Regions Chart */}
      <div className="glass-card chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Top Academic Regions</h3>
        </div>
        <div className="chart-wrapper">
          <div className="bar-chart-list">
            {regionData.map((item) => {
              const widthPercentage = (item.count / maxRegion) * 100;
              return (
                <div key={item.name} className="bar-chart-row">
                  <div className="bar-chart-labels">
                    <span className="bar-chart-name">{item.name === 'None' || !item.name ? 'Unspecified Region' : item.name}</span>
                    <span className="bar-chart-count">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="bar-chart-track">
                    <div 
                      className="bar-chart-fill" 
                      style={{ 
                        width: `${widthPercentage}%`,
                        background: 'linear-gradient(90deg, hsl(185 85% 45%) 0%, hsl(142 70% 45%) 100%)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
