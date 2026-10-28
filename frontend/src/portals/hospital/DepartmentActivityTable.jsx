import React, { useState, useMemo } from 'react'
import {
  Stethoscope, Layers, FlaskConical, Activity, BrainCircuit,
  Search, Filter, ArrowUpDown, Download, ChevronRight, Eye,
  CheckCircle2, Clock, AlertTriangle, X, Sparkles, Building2,
  TrendingUp, Users, Cpu, ShieldCheck
} from 'lucide-react'

const DEPARTMENTS_DATA = [
  {
    id: 'HEP-ONC',
    name: 'Hepatology & Oncology',
    code: 'HEP-ONC-01',
    location: 'Pavilion A • Level 4 • Ward 4A',
    icon: Stethoscope,
    iconTheme: 'blue',
    head: 'Dr. Riley Chen, MD',
    headRole: 'Lead Hepatologist & Chief of Oncology',
    headAvatar: 'RC',
    headOnline: true,
    staffCount: 14,
    staffLabel: '14 Clinicians',
    staffOnDuty: '12 On Shift',
    staffShiftRate: '86% Present',
    patientsCount: 482,
    patientTrend: '+12.4%',
    capacityPercent: 92,
    capacityStatus: 'high',
    beds: '120 Beds (110 occupied)',
    aiRuns: 194,
    aiLabel: '194 Runs',
    aiType: 'ConvNeXt + Swin',
    aiAccuracy: '94.2% AUC',
    status: 'Optimal',
    statusTier: 'optimal',
    latency: '38ms Latency',
    equipment: '3 Dedicated Infusion Suites, 120 Inpatient Beds, FibroScan 502 Touch',
    primaryFocus: 'HCC Multi-disciplinary Surveillance, Immunotherapy (Atezolizumab + Bevacizumab), TACE staging'
  },
  {
    id: 'RAD-PACS',
    name: 'Diagnostic Radiology & PACS',
    code: 'RAD-PACS-02',
    location: 'Imaging Center • Level B1 • Bay B',
    icon: Layers,
    iconTheme: 'purple',
    head: 'Dr. Marcus Vance, MD',
    headRole: 'Director of Abdominal Radiology',
    headAvatar: 'MV',
    headOnline: true,
    staffCount: 10,
    staffLabel: '10 Radiologists',
    staffOnDuty: '8 On Shift',
    staffShiftRate: '80% Present',
    patientsCount: 310,
    patientTrend: '+6.1%',
    capacityPercent: 85,
    capacityStatus: 'medium',
    beds: '4 Scanners (Siemens 128-slice)',
    aiRuns: 142,
    aiLabel: '142 CT Scans',
    aiType: 'nnU-Net 3D Volume',
    aiAccuracy: '0.92 Dice Index',
    status: 'Optimal',
    statusTier: 'optimal',
    latency: '1.2s Volumetric',
    equipment: '4 Siemens SOMATOM Dual-Source CT, 2 Magnetom Prisma 3T MRI Scanners',
    primaryFocus: 'Volumetric liver segmentation, LI-RADS v2018 observation grading, microvascular invasion (MVI)'
  },
  {
    id: 'LAB-PATH',
    name: 'Clinical Pathology & Lab',
    code: 'LAB-PATH-03',
    location: 'Central Diagnostic Wing • Level 2',
    icon: FlaskConical,
    iconTheme: 'cyan',
    head: 'Tech Alex Mercer, MLT',
    headRole: 'Lead Medical Technologist & LIMS Admin',
    headAvatar: 'AM',
    headOnline: true,
    staffCount: 8,
    staffLabel: '8 Technicians',
    staffOnDuty: '8 On Shift',
    staffShiftRate: '100% Present',
    patientsCount: 386,
    patientTrend: '+18.2%',
    capacityPercent: 96,
    capacityStatus: 'high',
    beds: '24/7 Automated Feed',
    aiRuns: 110,
    aiLabel: '110 OCR Extractions',
    aiType: 'LIMS Vision OCR',
    aiAccuracy: '98.4% Verified',
    status: 'High Throughput',
    statusTier: 'throughput',
    latency: '450ms Processing',
    equipment: 'Roche Cobas 8000 Immunoassay, Sysmex XN-9000 Coagulation, Stago STA-R Max',
    primaryFocus: 'Serum AFP kinetics, Liver Function Panels (AST, ALT, Bilirubin, INR), Automated OCR lab ingestion'
  },
  {
    id: 'INT-RAD',
    name: 'Interventional Radiology',
    code: 'INT-RAD-04',
    location: 'Surgical Suites • Level 3 • Suite 2',
    icon: Activity,
    iconTheme: 'rose',
    head: 'Dr. Elena Rostova, MD',
    headRole: 'Chief of Interventional Oncology',
    headAvatar: 'ER',
    headOnline: true,
    staffCount: 6,
    staffLabel: '6 Surgeons',
    staffOnDuty: '5 On Shift',
    staffShiftRate: '83% Present',
    patientsCount: 106,
    patientTrend: '+4.5%',
    capacityPercent: 72,
    capacityStatus: 'normal',
    beds: '2 Angio Suites (Active)',
    aiRuns: 38,
    aiLabel: '38 TACE Cases',
    aiType: 'DeepSurv Multimodal',
    aiAccuracy: '89.6% Prognostic',
    status: 'Optimal',
    statusTier: 'optimal',
    latency: '62ms Scoring',
    equipment: 'Artis pheno Robotic C-Arm Cone-Beam CT, Emprint Microwave Ablation System',
    primaryFocus: 'Drug-Eluting Bead TACE (DEB-TACE), Microwave Thermal Ablation, Y-90 Radioembolization planning'
  },
  {
    id: 'AI-INFORMATICS',
    name: 'AI & Clinical Informatics Unit',
    code: 'AI-CORE-05',
    location: 'Health Tech Center • Annex 2',
    icon: BrainCircuit,
    iconTheme: 'indigo',
    head: 'Dr. Sarah Jenkins, PhD',
    headRole: 'Chief Medical AI Officer',
    headAvatar: 'SJ',
    headOnline: true,
    staffCount: 4,
    staffLabel: '4 AI Scientists',
    staffOnDuty: '4 On Shift',
    staffShiftRate: '100% Present',
    patientsCount: 1284,
    patientTrend: '+12.4%',
    capacityPercent: 48,
    capacityStatus: 'low',
    beds: 'Dedicated GPU Cluster',
    aiRuns: 484,
    aiLabel: '484 System Runs',
    aiType: 'PyTorch v2.4 Multi-Model',
    aiAccuracy: '91.4% AUC-ROC',
    status: 'Optimal',
    statusTier: 'optimal',
    latency: '14ms Pipeline',
    equipment: 'NVIDIA DGX A100 GPU Cluster, Encrypted FHIR v4 Integration Bridge, RAG Knowledge Base',
    primaryFocus: 'Longitudinal risk fusion, real-time SHAP explainability, multimodal survival prognosis telemetry'
  }
]

export default function DepartmentActivityTable({ onShowNotice }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey, setSortKey] = useState('patientsCount')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedDept, setSelectedDept] = useState(null)

  // Filter & Sort Logic
  const filteredDepartments = useMemo(() => {
    return DEPARTMENTS_DATA.filter((dept) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q) ||
        dept.head.toLowerCase().includes(q) ||
        dept.primaryFocus.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Optimal' && dept.status === 'Optimal') ||
        (statusFilter === 'High Throughput' && dept.status === 'High Throughput')

      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      let valA = a[sortKey]
      let valB = b[sortKey]
      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [searchQuery, statusFilter, sortKey, sortDirection])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const exportCSV = () => {
    const headers = [
      'Department ID',
      'Department Name',
      'Location',
      'Department Head',
      'Active Staff',
      'Active Patients',
      'Capacity %',
      'AI Predictions Run',
      'AI Model',
      'Operational Status'
    ]
    const rows = filteredDepartments.map(d => [
      `"${d.code}"`,
      `"${d.name}"`,
      `"${d.location}"`,
      `"${d.head}"`,
      `"${d.staffLabel}"`,
      d.patientsCount,
      `"${d.capacityPercent}%"`,
      `"${d.aiLabel}"`,
      `"${d.aiType}"`,
      `"${d.status}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Hospital_Department_Roster_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (onShowNotice) onShowNotice('Department Roster CSV exported successfully')
  }

  return (
    <div className="structured-table-panel">
      {/* ── Table Header & Controls ─────────────────────────────────── */}
      <div className="structured-table-header">
        <div className="table-title-group">
          <div className="table-title-with-badge">
            <h2>Department Activity & Capacity Roster</h2>
            <span className="table-count-badge">{filteredDepartments.length} Departments Active</span>
          </div>
          <p>Real-time clinical staffing, live patient volume, and multimodal AI diagnostic throughput across units.</p>
        </div>

        <div className="table-action-strip">
          <button className="table-action-btn secondary" onClick={exportCSV} title="Export roster to CSV file">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Quick KPI Stat Strip ────────────────────────────────────── */}
      <div className="table-kpi-strip">
        <div className="table-kpi-item">
          <span className="kpi-label">Active Units</span>
          <strong className="kpi-value text-blue">5 Departments</strong>
          <span className="kpi-sub">100% Online</span>
        </div>
        <div className="table-kpi-item">
          <span className="kpi-label">Active Staff</span>
          <strong className="kpi-value text-green">42 Clinicians</strong>
          <span className="kpi-sub">37 on shift right now</span>
        </div>
        <div className="table-kpi-item">
          <span className="kpi-label">Patients Monitored</span>
          <strong className="kpi-value text-purple">1,284 Patients</strong>
          <span className="kpi-sub">+12.4% this month</span>
        </div>
        <div className="table-kpi-item">
          <span className="kpi-label">AI Predictions</span>
          <strong className="kpi-value text-cyan">484 AI Runs</strong>
          <span className="kpi-sub">94.2% Fleet AUC</span>
        </div>
        <div className="table-kpi-item">
          <span className="kpi-label">Operational Health</span>
          <strong className="kpi-value text-emerald">Optimal Fleet</strong>
          <span className="kpi-sub">Zero downtime</span>
        </div>
      </div>

      {/* ── Toolbar: Search & Status Filters ────────────────────────── */}
      <div className="table-toolbar">
        <div className="table-search-box">
          <Search size={16} className="table-search-icon" />
          <input
            type="text"
            placeholder="Filter by department, doctor head, or specialty…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="table-filter-pills">
          <button
            className={`filter-pill ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All Units ({DEPARTMENTS_DATA.length})
          </button>
          <button
            className={`filter-pill ${statusFilter === 'Optimal' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Optimal')}
          >
            <span className="pill-dot green" /> Optimal (4)
          </button>
          <button
            className={`filter-pill ${statusFilter === 'High Throughput' ? 'active' : ''}`}
            onClick={() => setStatusFilter('High Throughput')}
          >
            <span className="pill-dot cyan" /> High Throughput (1)
          </button>
        </div>
      </div>

      {/* ── Structured Table ────────────────────────────────────────── */}
      <div className="table-responsive-wrapper">
        <table className="structured-clinical-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable-th">
                <div className="th-content">
                  <span>Department & Clinical Unit</span>
                  <ArrowUpDown size={12} className={sortKey === 'name' ? 'active-sort' : ''} />
                </div>
              </th>
              <th>Department Head</th>
              <th onClick={() => handleSort('staffCount')} className="sortable-th">
                <div className="th-content">
                  <span>Active Doctors</span>
                  <ArrowUpDown size={12} className={sortKey === 'staffCount' ? 'active-sort' : ''} />
                </div>
              </th>
              <th onClick={() => handleSort('patientsCount')} className="sortable-th">
                <div className="th-content">
                  <span>Active Patients & Load</span>
                  <ArrowUpDown size={12} className={sortKey === 'patientsCount' ? 'active-sort' : ''} />
                </div>
              </th>
              <th onClick={() => handleSort('aiRuns')} className="sortable-th">
                <div className="th-content">
                  <span>AI Predictions Run</span>
                  <ArrowUpDown size={12} className={sortKey === 'aiRuns' ? 'active-sort' : ''} />
                </div>
              </th>
              <th>Operational Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty-cell">
                  <AlertTriangle size={24} style={{ color: '#f59e0b', marginBottom: '8px' }} />
                  <strong>No departments match your filter</strong>
                  <p>Try resetting the search keyword or status filter above.</p>
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept) => {
                const IconComponent = dept.icon
                return (
                  <tr
                    key={dept.id}
                    className="structured-row"
                    onClick={() => setSelectedDept(dept)}
                  >
                    {/* Department Name & Code */}
                    <td className="dept-primary-cell">
                      <div className="dept-item-wrap">
                        <div className={`dept-icon-box ${dept.iconTheme}`}>
                          <IconComponent size={20} />
                        </div>
                        <div className="dept-text-meta">
                          <strong className="dept-name-title">{dept.name}</strong>
                          <div className="dept-meta-tags">
                            <span className="dept-code-badge">{dept.code}</span>
                            <span className="dept-location-text">{dept.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department Head */}
                    <td className="dept-head-cell">
                      <div className="dept-head-wrap">
                        <div className="dept-avatar-circle">
                          <span>{dept.headAvatar}</span>
                          {dept.headOnline && <span className="avatar-online-dot" title="Doctor currently on duty" />}
                        </div>
                        <div className="dept-head-info">
                          <strong className="head-name">{dept.head}</strong>
                          <span className="head-role">{dept.headRole}</span>
                        </div>
                      </div>
                    </td>

                    {/* Active Doctors & Staffing */}
                    <td className="dept-staff-cell">
                      <div className="staff-stat-wrap">
                        <strong className="staff-count-main">{dept.staffLabel}</strong>
                        <div className="staff-duty-pill">
                          <span className="duty-dot" /> {dept.staffOnDuty}
                        </div>
                      </div>
                    </td>

                    {/* Active Patients & Capacity Bar */}
                    <td className="dept-patients-cell">
                      <div className="patients-capacity-wrap">
                        <div className="patients-top-row">
                          <strong className="patients-count-val">{dept.patientsCount.toLocaleString()} Patients</strong>
                          <span className="patients-trend-tag positive">
                            <TrendingUp size={11} /> {dept.patientTrend}
                          </span>
                        </div>
                        <div className="capacity-bar-container">
                          <div
                            className={`capacity-bar-fill ${dept.capacityStatus}`}
                            style={{ width: `${dept.capacityPercent}%` }}
                          />
                        </div>
                        <div className="capacity-bar-labels">
                          <span>Capacity</span>
                          <strong>{dept.capacityPercent}% ({dept.beds})</strong>
                        </div>
                      </div>
                    </td>

                    {/* AI Predictions Run */}
                    <td className="dept-ai-cell">
                      <div className="ai-stat-box">
                        <div className="ai-stat-top">
                          <Sparkles size={13} className="ai-sparkle-icon" />
                          <strong className="ai-runs-count">{dept.aiLabel}</strong>
                        </div>
                        <div className="ai-engine-chip">
                          <Cpu size={11} /> {dept.aiType}
                        </div>
                        <span className="ai-accuracy-text">Telemetry: {dept.aiAccuracy}</span>
                      </div>
                    </td>

                    {/* Operational Status */}
                    <td className="dept-status-cell">
                      <div className={`status-glow-pill ${dept.statusTier}`}>
                        <span className="status-live-dot" />
                        <span className="status-label-text">{dept.status}</span>
                      </div>
                      <span className="latency-subtext">{dept.latency}</span>
                    </td>

                    {/* Action Button */}
                    <td className="dept-action-cell" style={{ textAlign: 'right' }}>
                      <button
                        className="inspect-dept-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDept(dept)
                        }}
                        title="View complete department analytics & staff roster"
                      >
                        <span>Inspect</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer Summary ────────────────────────────────────── */}
      <div className="structured-table-footer">
        <div className="footer-legend">
          <span className="legend-item">
            <span className="legend-dot green" /> Optimal: System processing at full operational throughput
          </span>
          <span className="legend-item">
            <span className="legend-dot cyan" /> High Throughput: Peak sample intake pipeline active
          </span>
        </div>
        <div className="footer-summary-counts">
          Showing <strong>{filteredDepartments.length}</strong> of <strong>{DEPARTMENTS_DATA.length}</strong> Clinical Units
        </div>
      </div>

      {/* ── Department Inspection Modal / Drawer ────────────────────── */}
      {selectedDept && (
        <div className="dept-modal-backdrop" onClick={() => setSelectedDept(null)}>
          <div className="dept-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-header">
              <div className="dept-modal-title-row">
                <div className={`dept-icon-box ${selectedDept.iconTheme} large`}>
                  {React.createElement(selectedDept.icon, { size: 24 })}
                </div>
                <div>
                  <div className="dept-modal-eyebrow">{selectedDept.code} • CLINICAL UNIT DOSSIER</div>
                  <h3>{selectedDept.name}</h3>
                  <span className="dept-modal-loc">{selectedDept.location}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedDept(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="dept-modal-body">
              <div className="modal-grid-2col">
                {/* Department Leadership Card */}
                <div className="modal-subcard">
                  <h4>Unit Leadership & Staffing</h4>
                  <div className="modal-leader-info">
                    <div className="dept-avatar-circle large">
                      <span>{selectedDept.headAvatar}</span>
                      <span className="avatar-online-dot" />
                    </div>
                    <div>
                      <strong>{selectedDept.head}</strong>
                      <p>{selectedDept.headRole}</p>
                      <div className="duty-badge green">
                        <ShieldCheck size={12} /> Board Certified & On Shift
                      </div>
                    </div>
                  </div>
                  <div className="modal-stat-list">
                    <div className="modal-stat-row">
                      <span>Assigned Clinicians:</span>
                      <strong>{selectedDept.staffLabel}</strong>
                    </div>
                    <div className="modal-stat-row">
                      <span>Active Shift Coverage:</span>
                      <strong>{selectedDept.staffOnDuty} ({selectedDept.staffShiftRate})</strong>
                    </div>
                  </div>
                </div>

                {/* Patient Load & Bed Capacity */}
                <div className="modal-subcard">
                  <h4>Patient Load & Facility Capacity</h4>
                  <div className="modal-capacity-highlight">
                    <div className="modal-capacity-score">
                      <strong>{selectedDept.capacityPercent}%</strong>
                      <span>Capacity Utilization</span>
                    </div>
                    <div className="modal-capacity-detail">
                      <strong>{selectedDept.patientsCount} Active Patients</strong>
                      <p>{selectedDept.beds}</p>
                    </div>
                  </div>
                  <div className="capacity-bar-container large">
                    <div
                      className={`capacity-bar-fill ${selectedDept.capacityStatus}`}
                      style={{ width: `${selectedDept.capacityPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Diagnostic Integration */}
              <div className="modal-subcard" style={{ marginTop: '16px' }}>
                <h4>AI Telemetry & Diagnostic Engines</h4>
                <div className="modal-grid-3col">
                  <div className="modal-ai-box">
                    <span className="ai-box-label">Inference Volume</span>
                    <strong>{selectedDept.aiLabel}</strong>
                    <span className="ai-box-foot positive">100% Validated</span>
                  </div>
                  <div className="modal-ai-box">
                    <span className="ai-box-label">Primary AI Architecture</span>
                    <strong>{selectedDept.aiType}</strong>
                    <span className="ai-box-foot">PyTorch v2.4</span>
                  </div>
                  <div className="modal-ai-box">
                    <span className="ai-box-label">Model Benchmark</span>
                    <strong>{selectedDept.aiAccuracy}</strong>
                    <span className="ai-box-foot">{selectedDept.latency}</span>
                  </div>
                </div>
              </div>

              {/* Clinical Focus & Equipment */}
              <div className="modal-subcard" style={{ marginTop: '16px' }}>
                <h4>Facilities, Equipment & Clinical Scope</h4>
                <div className="modal-stat-row">
                  <span>Hardware Infrastructure:</span>
                  <strong>{selectedDept.equipment}</strong>
                </div>
                <div className="modal-stat-row" style={{ marginTop: '8px' }}>
                  <span>Clinical Scope:</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    {selectedDept.primaryFocus}
                  </p>
                </div>
              </div>
            </div>

            <div className="dept-modal-footer">
              <button
                className="outline-button"
                onClick={() => {
                  setSelectedDept(null)
                  if (onShowNotice) onShowNotice(`Directing to ${selectedDept.name} live monitor…`)
                }}
              >
                Close Dossier
              </button>
              <button
                className="primary-button hospital-primary-btn"
                onClick={() => {
                  setSelectedDept(null)
                  if (onShowNotice) onShowNotice(`Opened full audit and clinical schedule for ${selectedDept.name}`)
                }}
              >
                View Full Department Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
