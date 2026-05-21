import { useState, useMemo, useEffect } from 'react'
// ... existing imports remain unchanged
import tenantsData from './data/tenants.json'
import { StatsGrid } from './components/StatsGrid';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TenantTable, Tenant } from './components/TenantTable';
import { TenantDrawer } from './components/TenantDrawer';

// Type-cast imported JSON as Tenant array
const rawTenants: Tenant[] = tenantsData as Tenant[];

export default function App() {
  // Theme toggle state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.remove('light')
    } else {
      root.classList.add('light')
    }
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  // --- Existing States ---
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedErp, setSelectedErp] = useState('All')
  const [selectedDeployment, setSelectedDeployment] = useState('All')
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [selectedAccountType, setSelectedAccountType] = useState('All')
  const [selectedLabel, setSelectedLabel] = useState('All')
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // --- Dynamic Filter Options ---
  // We extract these dynamically from the total dataset so the filters are always accurate!
  const filterOptions = useMemo(() => {
    const erps = new Set<string>()
    const deployments = new Set<string>()
    const regions = new Set<string>()
    const accountTypes = new Set<string>()
    const labels = new Set<string>()

    rawTenants.forEach(item => {
      if (item.erp_type) erps.add(item.erp_type)
      if (item.deployment_type) deployments.add(item.deployment_type)
      if (item.region) regions.add(item.region)
      if (item.account_type) accountTypes.add(item.account_type)
      if (item.label) {
        // Normalize label values briefly
        if (item.label.toLowerCase().includes('prod')) labels.add('Production')
        else if (item.label.toLowerCase().includes('test')) labels.add('Test')
        else if (item.label.toLowerCase().includes('stage')) labels.add('Stage')
        else if (item.label.toLowerCase().includes('dev')) labels.add('Development')
        else labels.add(item.label)
      }
    })

    return {
      erps: ['All', ...Array.from(erps).sort()],
      deployments: ['All', ...Array.from(deployments).sort()],
      regions: ['All', ...Array.from(regions).sort()],
      accountTypes: ['All', ...Array.from(accountTypes).sort()],
      labels: ['All', 'Production', 'Test', 'Stage', 'Development', ...Array.from(labels).filter(l => !['production', 'test', 'stage', 'development'].includes(l.toLowerCase())).sort()]
    }
  }, [])

  // --- Filtering Logic ---
  const filteredTenants = useMemo(() => {
    return rawTenants.filter(item => {
      // 1. Search Query Check
      const query = searchQuery.trim().toLowerCase()
      if (query) {
        const matchesName = item.name?.toLowerCase().includes(query)
        const matchesAlias = item.alias?.toLowerCase().includes(query)
        const matchesRegion = item.region?.toLowerCase().includes(query)
        const matchesErp = item.erp_type?.toLowerCase().includes(query)
        const matchesDep = item.deployment_type?.toLowerCase().includes(query)
        const matchesAccount = item.account_type?.toLowerCase().includes(query)
        const matchesId = item.accountId?.toLowerCase().includes(query)
        
        if (!matchesName && !matchesAlias && !matchesRegion && !matchesErp && !matchesDep && !matchesAccount && !matchesId) {
          return false
        }
      }

      // 2. Dropdown Filters
      if (selectedErp !== 'All' && item.erp_type !== selectedErp) return false
      if (selectedDeployment !== 'All' && item.deployment_type !== selectedDeployment) return false
      if (selectedRegion !== 'All' && item.region !== selectedRegion) return false
      if (selectedAccountType !== 'All' && item.account_type !== selectedAccountType) return false
      
      if (selectedLabel !== 'All') {
        const labelLower = item.label?.toLowerCase() || ''
        const filterLower = selectedLabel.toLowerCase()
        if (filterLower === 'production' && !labelLower.includes('prod')) return false
        if (filterLower === 'test' && !labelLower.includes('test')) return false
        if (filterLower === 'stage' && !labelLower.includes('stage')) return false
        if (filterLower === 'development' && !labelLower.includes('dev') && !labelLower.includes('devl')) return false
        if (!['production', 'test', 'stage', 'development'].includes(filterLower) && item.label !== selectedLabel) return false
      }

      return true
    })
  }, [searchQuery, selectedErp, selectedDeployment, selectedRegion, selectedAccountType, selectedLabel])

  // --- Sorting Logic ---
  const sortedTenants = useMemo(() => {
    const sorted = [...filteredTenants]
    sorted.sort((a, b) => {
      let valA: string = ''
      let valB: string = ''

      if (sortBy === 'name') {
        valA = a.name || ''
        valB = b.name || ''
      } else if (sortBy === 'alias') {
        valA = a.alias || ''
        valB = b.alias || ''
      } else if (sortBy === 'erp_type') {
        valA = a.erp_type || ''
        valB = b.erp_type || ''
      } else if (sortBy === 'deployment_type') {
        valA = a.deployment_type || ''
        valB = b.deployment_type || ''
      } else if (sortBy === 'region') {
        valA = a.region || ''
        valB = b.region || ''
      } else if (sortBy === 'account_type') {
        valA = a.account_type || ''
        valB = b.account_type || ''
      } else if (sortBy === 'label') {
        valA = a.label || ''
        valB = b.label || ''
      }

      const comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' })
      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredTenants, sortBy, sortOrder])

  // --- Analytical Calculations ---
  // Stats calculated dynamically relative to the CURRENT filtered dataset
  const stats = useMemo(() => {
    let clients = 0
    let saasCount = 0
    let erpCount = 0

    filteredTenants.forEach(item => {
      const type = item.account_type?.toLowerCase() || ''
      const isClient = type.includes('client')
      if (isClient) {
        clients++
        if (item.deployment_type?.toLowerCase() === 'saas') {
          saasCount++
        }
      }
      if (item.erp_type && item.erp_type.toLowerCase() !== 'none') {
        erpCount++
      }
    })

    return {
      total: filteredTenants.length,
      clients,
      saasCount,
      erpCount
    }
  }, [filteredTenants])

  // Chart data calculations
  const chartsData = useMemo(() => {
    const erpMap = new Map<string, number>()
    const deploymentMap = new Map<string, number>()
    const regionMap = new Map<string, number>()

    filteredTenants.forEach(item => {
      const erp = item.erp_type || 'None'
      erpMap.set(erp, (erpMap.get(erp) || 0) + 1)

      const dep = item.deployment_type || 'None'
      deploymentMap.set(dep, (deploymentMap.get(dep) || 0) + 1)

      const reg = item.region || 'Unknown'
      regionMap.set(reg, (regionMap.get(reg) || 0) + 1)
    })

    const erpList = Array.from(erpMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const deploymentList = Array.from(deploymentMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const regionList = Array.from(regionMap, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 regions

    return {
      erp: erpList,
      deployment: deploymentList,
      region: regionList
    }
  }, [filteredTenants])

  // --- Actions ---
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedErp('All')
    setSelectedDeployment('All')
    setSelectedRegion('All')
    setSelectedAccountType('All')
    setSelectedLabel('All')
    setCurrentPage(1)
  }

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Export current filtered list to CSV
  const handleExportCsv = () => {
    if (sortedTenants.length === 0) return

    const headers = ['Tenant ID', 'Name', 'Alias', 'Label', 'ERP', 'Deployment', 'Region', 'Classification', 'Salesforce ID']
    const rows = sortedTenants.map(t => [
      t.id,
      `"${t.name?.replace(/"/g, '""') || ''}"`,
      t.alias || '',
      t.label || '',
      t.erp_type || '',
      t.deployment_type || '',
      t.region || '',
      t.account_type || '',
      t.accountId || ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ethos_tenants_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="bg-gradient-canvas" />
      
      <div className="app-container">
        
        {/* Header Section */}
        <header className="header animate-fade-in">
          <div className="header-title-group">
            <h1 className="header-title">
              <span>🌐</span> Ethos Academic Directory
            </h1>
            <p className="header-subtitle">
              Sleek analytics and search engine across Ellucian's complete global cloud tenant database
            </p>
          </div>
          
                    <div className="header-actions">
            <button className="btn btn-secondary" onClick={toggleTheme} title="Toggle light/dark mode">
              {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
            </button>
            <button className="btn btn-secondary" onClick={handleExportCsv} disabled={sortedTenants.length === 0}>
              📥 Export to CSV
            </button>
            <button className="btn btn-primary" onClick={handleResetFilters}>
              🔄 Reset Directory
            </button>
          </div>

        </header>

        {/* Stats Summary Panel */}
        <StatsGrid 
          total={stats.total} 
          clients={stats.clients} 
          saasCount={stats.saasCount} 
          erpCount={stats.erpCount} 
        />

        {/* Filtering & Toolbar Controls */}
        <div className="glass-card filter-bar animate-fade-in" style={{ animationDelay: '0.05s' }}>
          
          {/* Search Box */}
          <div className="input-group">
            <div className="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search university name, alias, territory, ID..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* ERP Dropdown */}
          <select 
            className="select-field" 
            value={selectedErp} 
            onChange={(e) => {
              setSelectedErp(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option disabled value="">ERP System</option>
            {filterOptions.erps.map(erp => (
              <option key={erp} value={erp}>{erp === 'All' ? 'All ERPs' : erp}</option>
            ))}
          </select>

          {/* Deployment Dropdown */}
          <select 
            className="select-field" 
            value={selectedDeployment} 
            onChange={(e) => {
              setSelectedDeployment(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option disabled value="">Deployment</option>
            {filterOptions.deployments.map(dep => (
              <option key={dep} value={dep}>{dep === 'All' ? 'All Deployments' : dep}</option>
            ))}
          </select>

          {/* Region Dropdown */}
          <select 
            className="select-field" 
            value={selectedRegion} 
            onChange={(e) => {
              setSelectedRegion(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option disabled value="">Region</option>
            {filterOptions.regions.map(reg => (
              <option key={reg} value={reg}>{reg === 'All' ? 'All Regions' : reg}</option>
            ))}
          </select>

          {/* Classification Dropdown */}
          <select 
            className="select-field" 
            value={selectedAccountType} 
            onChange={(e) => {
              setSelectedAccountType(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option disabled value="">Classification</option>
            {filterOptions.accountTypes.map(type => (
              <option key={type} value={type}>{type === 'All' ? 'All Classifications' : type}</option>
            ))}
          </select>

          {/* Label Dropdown */}
          <select 
            className="select-field" 
            value={selectedLabel} 
            onChange={(e) => {
              setSelectedLabel(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option disabled value="">Environment</option>
            {filterOptions.labels.map(lbl => (
              <option key={lbl} value={lbl}>{lbl === 'All' ? 'All Environments' : lbl}</option>
            ))}
          </select>

        </div>

        {/* Custom Analytics Charts */}
        <AnalyticsCharts 
          erpData={chartsData.erp} 
          deploymentData={chartsData.deployment}
          regionData={chartsData.region} 
        />

        {/* Directory Listing Table */}
        <TenantTable 
          tenants={sortedTenants}
          searchQuery={searchQuery}
          currentPage={currentPage}
          pageSize={pageSize}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={handlePageChange}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
          onSortChange={handleSortChange}
          onTenantSelect={setSelectedTenant}
        />

        {/* Slide-out details drawer */}
        <TenantDrawer 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
        />

      </div>
    </>
  )
}
