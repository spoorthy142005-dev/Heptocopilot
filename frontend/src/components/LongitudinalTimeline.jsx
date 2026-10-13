import { useState, useEffect, useMemo } from 'react'
import {
  CalendarDays, Clock, Filter, Search, ShieldCheck, Activity, BrainCircuit,
  FileText, FlaskConical, Target, Stethoscope, Layers, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Plus, Download, ChevronRight, X, User, CheckCircle2,
  AlertTriangle, Sparkles, SlidersHorizontal, Eye, RefreshCw, BarChart2, ShieldAlert,
  GitCompare, LineChart, FileSpreadsheet, Check, ChevronDown
} from 'lucide-react'

const API = (path) => `http://127.0.0.1:8000${path}`

const CATEGORIES = [
  { key: 'all', label: 'All Events', color: '#00f2fe', icon: CalendarDays },
  { key: 'registration', label: 'Registration', color: '#3b82f6', icon: User },
  { key: 'clinical_assessment', label: 'Clinical Intake', color: '#8b5cf6', icon: Stethoscope },
  { key: 'lab_test', label: 'Lab Biomarkers', color: '#06b6d4', icon: FlaskConical },
  { key: 'imaging_scan', label: 'Imaging CT/MRI', color: '#3b82f6', icon: Layers },
  { key: 'tumor_analysis', label: 'Tumor Analysis', color: '#f43f5e', icon: Target },
  { key: 'ai_risk_assessment', label: 'AI Risk Prediction', color: '#ec4899', icon: BrainCircuit },
  { key: 'treatment', label: 'Treatment & TACE', color: '#10b981', icon: Activity },
  { key: 'doctor_note', label: 'Doctor Note', color: '#f59e0b', icon: FileText },
  { key: 'followup', label: 'Follow-up', color: '#06b6d4', icon: CheckCircle2 }
]

const BIOMARKER_CONFIGS = [
  { key: 'afp', label: 'AFP', unit: 'ng/mL', color: '#f43f5e', ref: '< 20 ng/mL' },
  { key: 'alt', label: 'ALT', unit: 'U/L', color: '#06b6d4', ref: '7 - 56 U/L' },
  { key: 'ast', label: 'AST', unit: 'U/L', color: '#3b82f6', ref: '10 - 40 U/L' },
  { key: 'albumin', label: 'Albumin', unit: 'g/dL', color: '#10b981', ref: '3.5 - 5.0 g/dL' },
  { key: 'bilirubin', label: 'Bilirubin', unit: 'mg/dL', color: '#f59e0b', ref: '0.2 - 1.2 mg/dL' },
  { key: 'platelets', label: 'Platelets', unit: '×10³/μL', color: '#8b5cf6', ref: '150 - 450' },
  { key: 'inr', label: 'INR', unit: '', color: '#ec4899', ref: '0.8 - 1.1' },
  { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', color: '#64748b', ref: '0.6 - 1.2 mg/dL' }
]

export default function LongitudinalTimeline({ patientId = 'PT-10482', onNotice }) {
  const [data, setData]                     = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDoctor, setSelectedDoctor] = useState('all')
  const [dateRange, setDateRange]           = useState('all')
  const [viewMode, setViewMode]             = useState('detailed') // 'compact' | 'detailed'
  
  // Interactive Modal / Drawer States
  const [selectedEvent, setSelectedEvent]   = useState(null)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [scanAId, setScanAId]               = useState(null)
  const [scanBId, setScanBId]               = useState(null)
  const [aiEvolutionOpen, setAiEvolutionOpen] = useState(false)
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false)
  const [addNoteOpen, setAddNoteOpen]       = useState(false)
  const [newNoteText, setNewNoteText]       = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Selected Biomarkers for Longitudinal Line Graph
  const [activeBiomarkers, setActiveBiomarkers] = useState(['afp', 'albumin', 'alt'])

  // Fetch timeline data from FastAPI backend
  const fetchTimeline = async () => {
    setLoading(true)
    setError('')
    try {
      let url = API(`/api/patients/${patientId}/timeline`)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedDoctor !== 'all') params.append('doctor', selectedDoctor)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const result = await res.json()
      setData(result)
      
      // Auto-select first two imaging scans for comparison
      const scans = (result.events || []).filter(e => e.category === 'imaging_scan')
      if (scans.length >= 2) {
        setScanAId(scans[scans.length - 1].id)
        setScanBId(scans[0].id)
      } else if (scans.length === 1) {
        setScanAId(scans[0].id)
        setScanBId(scans[0].id)
      }
    } catch (err) {
      setError(err.message || 'Failed to load longitudinal timeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimeline()
  }, [patientId, selectedCategory, selectedDoctor])

  // Extract unique doctors for filter dropdown
  const doctorsList = useMemo(() => {
    if (!data?.events) return []
    const docs = new Set()
    data.events.forEach(e => {
      if (e.doctor) docs.add(e.doctor)
    })
    return Array.from(docs)
  }, [data])

  // Filter events locally by search term & date range
  const filteredEvents = useMemo(() => {
    if (!data?.events) return []
    return data.events.filter(ev => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchTitle = ev.title?.toLowerCase().includes(q)
        const matchSum = ev.summary?.toLowerCase().includes(q)
        const matchDoc = ev.doctor?.toLowerCase().includes(q)
        const matchSrc = ev.source?.toLowerCase().includes(q)
        if (!matchTitle && !matchSum && !matchDoc && !matchSrc) return false
      }
      if (dateRange === '30d') {
        const d = new Date(ev.date)
        const cutoff = new Date('2026-08-14')
        if (d < cutoff) return false
      } else if (dateRange === '90d') {
        const d = new Date(ev.date)
        const cutoff = new Date('2026-06-14')
        if (d < cutoff) return false
      } else if (dateRange === '1y') {
        const d = new Date(ev.date)
        const cutoff = new Date('2025-09-14')
        if (d < cutoff) return false
      }
      return true
    })
  }, [data, searchQuery, dateRange])

  // Extract lab history points for biomarker line graph
  const labHistory = useMemo(() => {
    if (!data?.events) return []
    return data.events
      .filter(e => e.category === 'lab_test' && e.labs)
      .map(e => ({
        date: e.date.split(' ')[0],
        timestamp: e.timestamp,
        ...e.labs
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [data])

  // Extract imaging history points for tumor tracking
  const imagingHistory = useMemo(() => {
    if (!data?.events) return []
    return data.events
      .filter(e => e.category === 'imaging_scan' && e.imaging)
      .map(e => ({
        id: e.id,
        date: e.date.split(' ')[0],
        title: e.title,
        doctor: e.doctor,
        timestamp: e.timestamp,
        ...e.imaging
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [data])

  // Extract AI prediction history
  const aiHistory = useMemo(() => {
    if (!data?.events) return []
    return data.events
      .filter(e => e.category === 'ai_risk_assessment' && e.ai_prediction)
      .map(e => ({
        id: e.id,
        date: e.date.split(' ')[0],
        timestamp: e.timestamp,
        ...e.ai_prediction
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [data])

  // Submit doctor note handler
  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    setSubmittingNote(true)
    try {
      const res = await fetch(API(`/api/patients/${patientId}/notes`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNoteText,
          author: 'Dr. Riley Chen (Oncology Lead)',
          category: 'doctor_note'
        })
      })
      if (!res.ok) throw new Error('Failed to save clinical note')
      setNewNoteText('')
      setAddNoteOpen(false)
      if (onNotice) onNotice('Clinical note signed and added to timeline')
      fetchTimeline()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingNote(false)
    }
  }

  // PDF Export Handler
  const handleExportPDF = () => {
    window.open(API(`/api/patients/${patientId}/timeline/pdf`), '_blank')
    if (onNotice) onNotice('Generating clinical PDF report...')
  }

  const toggleBiomarker = (key) => {
    if (activeBiomarkers.includes(key)) {
      if (activeBiomarkers.length > 1) {
        setActiveBiomarkers(activeBiomarkers.filter(k => k !== key))
      }
    } else {
      setActiveBiomarkers([...activeBiomarkers, key])
    }
  }

  if (loading && !data) {
    return (
      <div className="timeline-loading-shell" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        <RefreshCw size={32} className="spin-loader" style={{ margin: '0 auto 16px', color: '#00f2fe' }} />
        <h3>Loading Longitudinal Patient Timeline...</h3>
        <p>Aggregating EHR, PACS CT scans, lab panels, and AI model telemetry...</p>
      </div>
    )
  }

  const patient = data?.patient || { name: 'James Morrison', age: 58, gender: 'Male', mrn: 'MRN-88401', risk_tier: 'High' }
  const summary = data?.summary || {}

  // Scans selected for Compare Modal
  const scanA = imagingHistory.find(s => s.id === scanAId) || imagingHistory[0]
  const scanB = imagingHistory.find(s => s.id === scanBId) || imagingHistory[imagingHistory.length - 1]

  return (
    <div className="longitudinal-timeline-container">
      {/* ─── 1. DISEASE JOURNEY SUMMARY HEADER ────────────────────────────── */}
      <section className="disease-journey-summary-bar">
        <div className="summary-metric-box">
          <span className="metric-label">First Assessment</span>
          <strong className="metric-val">{summary.first_assessment || '2025-09-15'}</strong>
          <small className="metric-sub">Surveillance Program Intake</small>
        </div>

        <div className="summary-metric-box">
          <span className="metric-label">Latest Assessment</span>
          <strong className="metric-val cyan-text">{summary.latest_assessment || '2026-09-10'}</strong>
          <small className="metric-sub">Multi-Disciplinary Tumor Board</small>
        </div>

        <div className="summary-metric-box">
          <span className="metric-label">Latest CT/MRI Scan</span>
          <strong className="metric-val">{summary.latest_scan || '2026-06-20'}</strong>
          <small className="metric-sub">Post-TACE Triphasic CT</small>
        </div>

        <div className="summary-metric-box">
          <span className="metric-label">Longitudinal Tumor Trend</span>
          <strong className="metric-val coral-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={18} /> {summary.tumor_trend || '+14.3% Increase'}
          </strong>
          <small className="metric-sub">{summary.tumor_volume_trend || '+14.1% Volume Growth'}</small>
        </div>

        <div className="summary-metric-box">
          <span className="metric-label">Latest AI Risk Prediction</span>
          <strong className="metric-val purple-text">{summary.latest_ai_risk || '0.8842 (LR-5)'}</strong>
          <small className="metric-sub">ConvNeXt + Swin Transformer</small>
        </div>

        <div className="summary-metric-box">
          <span className="metric-label">Last Follow-up</span>
          <strong className="metric-val green-text">{summary.last_followup || '2026-09-10'}</strong>
          <small className="metric-sub">Dr. Riley Chen (Oncology)</small>
        </div>
      </section>

      {/* ─── 2. TOOLBAR & CONTROLS BAR ─────────────────────────────────────── */}
      <section className="timeline-toolbar-panel">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search timeline events, labs, scans, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}><X size={14} /></button>
          )}
        </div>

        <div className="filter-group">
          {/* Date Range Selector */}
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="select-pill">
            <option value="all">📅 All Time (Full History)</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
          </select>

          {/* Clinician Filter */}
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="select-pill">
            <option value="all">👨‍⚕️ All Clinicians & AI</option>
            {doctorsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="segmented-toggle">
            <button
              className={viewMode === 'detailed' ? 'active' : ''}
              onClick={() => setViewMode('detailed')}
            >
              <FileText size={14} /> Detailed
            </button>
            <button
              className={viewMode === 'compact' ? 'active' : ''}
              onClick={() => setViewMode('compact')}
            >
              <Clock size={14} /> Compact
            </button>
          </div>
        </div>

        <div className="action-buttons-group">
          <button className="btn-secondary" onClick={() => setCompareModalOpen(true)}>
            <GitCompare size={15} /> Compare Scans
          </button>

          <button className="btn-secondary" onClick={() => setAiEvolutionOpen(true)}>
            <Sparkles size={15} /> AI Evolution
          </button>

          <button className="btn-secondary" onClick={() => setBeforeAfterOpen(true)}>
            <LineChart size={15} /> Before vs After
          </button>

          <button className="btn-accent" onClick={() => setAddNoteOpen(true)}>
            <Plus size={15} /> Add Note
          </button>

          <button className="btn-primary" onClick={handleExportPDF}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </section>

      {/* Category Filter Chips Bar */}
      <div className="category-chips-bar">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.key
          return (
            <button
              key={cat.key}
              className={`cat-chip ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
              style={{ '--chip-color': cat.color }}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* ─── 3. BIOMARKER LONGITUDINAL TREND ANALYZER ──────────────────────── */}
      {labHistory.length > 0 && (
        <section className="panel biomarker-trend-panel">
          <div className="panel-heading">
            <div>
              <h2><FlaskConical size={18} style={{ color: '#06b6d4', display: 'inline', marginRight: '6px' }} /> Longitudinal Lab Biomarker Trends</h2>
              <p>Track serum AFP, ALT, AST, Albumin, Bilirubin, and platelet counts across dates</p>
            </div>

            <div className="biomarker-chips-selector">
              {BIOMARKER_CONFIGS.map(b => (
                <button
                  key={b.key}
                  className={`bio-chip ${activeBiomarkers.includes(b.key) ? 'active' : ''}`}
                  onClick={() => toggleBiomarker(b.key)}
                  style={{ '--bio-color': b.color }}
                >
                  <span className="dot" style={{ background: b.color }} />
                  {b.label} <em>({b.unit})</em>
                </button>
              ))}
            </div>
          </div>

          <div className="biomarker-chart-container">
            {/* SVG Interactive Multi-Biomarker Trend Chart */}
            <BiomarkerSvgChart data={labHistory} activeKeys={activeBiomarkers} />
          </div>
        </section>
      )}

      {/* ─── 4. LONGITUDINAL TUMOR TRACKING SECTION ────────────────────────── */}
      {imagingHistory.length > 0 && (
        <section className="panel tumor-tracking-panel">
          <div className="panel-heading">
            <div>
              <h2><Target size={18} style={{ color: '#f43f5e', display: 'inline', marginRight: '6px' }} /> Longitudinal Tumor & Lesion Measurements</h2>
              <p>Track lesion max diameter (mm), tumor volume (cm³), and calculated % change between scans</p>
            </div>
            <button className="btn-sm-outline" onClick={() => setCompareModalOpen(true)}>
              <GitCompare size={14} /> Open Side-by-Side Compare
            </button>
          </div>

          <div className="scans-trend-grid">
            {imagingHistory.map((scan, i) => (
              <div key={scan.id || i} className="scan-trend-card">
                <div className="scan-card-header">
                  <span className="scan-date">{scan.date}</span>
                  <span className={`trend-badge ${scan.trend_status === 'Increased' ? 'high' : scan.trend_status === 'Decreased' ? 'low' : 'mod'}`}>
                    {scan.trend_status === 'Increased' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {scan.trend_status} {scan.volume_change_pct ? `(${scan.volume_change_pct > 0 ? '+' : ''}${scan.volume_change_pct}%)` : ''}
                  </span>
                </div>

                <div className="scan-metrics-row">
                  <div>
                    <span className="lbl">Max Diameter</span>
                    <strong className="val">{scan.max_diameter_mm} mm</strong>
                  </div>
                  <div>
                    <span className="lbl">Tumor Volume</span>
                    <strong className="val">{scan.tumor_volume_cm3} cm³</strong>
                  </div>
                  <div>
                    <span className="lbl">Tumor/Liver Ratio</span>
                    <strong className="val">{scan.tumor_liver_ratio_pct}%</strong>
                  </div>
                </div>

                {scan.thumbnail && (
                  <div className="scan-thumb-wrap">
                    <img src={scan.thumbnail} alt={scan.title} />
                    <span className="modality-tag">{scan.modality}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 5. VERTICAL CHRONOLOGICAL TIMELINE AXIS ───────────────────────── */}
      <section className="timeline-axis-section">
        <div className="timeline-section-header">
          <h2>Chronological Patient Journey ({filteredEvents.length} Events)</h2>
          <span>Sorted newest to baseline</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="timeline-empty-state">
            <ShieldAlert size={36} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
            <h3>No Timeline Events Found</h3>
            <p>Try adjusting your search query, date range, or category filter.</p>
          </div>
        ) : (
          <div className={`vertical-timeline-stem ${viewMode}`}>
            {filteredEvents.map((evt, idx) => {
              const catMeta = CATEGORIES.find(c => c.key === evt.category) || CATEGORIES[0]
              const CatIcon = catMeta.icon

              return (
                <div key={evt.id || idx} className={`timeline-event-node category-${evt.category}`}>
                  {/* Vertical Line Node Bullet */}
                  <div className="node-bullet" style={{ borderColor: catMeta.color, background: catMeta.color }}>
                    <CatIcon size={14} style={{ color: '#fff' }} />
                  </div>

                  {/* Main Event Card */}
                  <div className="timeline-card-content">
                    <div className="card-top-row">
                      <span className="event-date">
                        <Clock size={13} /> {evt.date}
                      </span>

                      <span className="category-pill" style={{ background: `${catMeta.color}22`, color: catMeta.color, borderColor: `${catMeta.color}55` }}>
                        {evt.category_name || catMeta.label}
                      </span>

                      <span className="event-source">{evt.source}</span>

                      <button className="btn-icon-more" title="View Details" onClick={() => setSelectedEvent(evt)}>
                        <Eye size={14} />
                      </button>
                    </div>

                    <h3 className="event-title">{evt.title}</h3>
                    <div className="event-doctor">
                      <Stethoscope size={13} /> <span>{evt.doctor}</span>
                    </div>

                    <p className="event-summary">{evt.summary}</p>

                    {/* Inline Event Specific Snippets */}
                    {evt.labs && (
                      <div className="inline-labs-grid">
                        {Object.entries(evt.labs).map(([k, v]) => {
                          if (typeof v !== 'number') return null
                          const cfg = BIOMARKER_CONFIGS.find(b => b.key === k)
                          if (!cfg) return null
                          return (
                            <span key={k} className="inline-lab-chip">
                              <em>{cfg.label}:</em> <strong>{v}</strong> <small>{cfg.unit}</small>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {evt.imaging && (
                      <div className="inline-imaging-box">
                        <div className="img-info">
                          <span><strong>Modality:</strong> {evt.imaging.modality}</span>
                          <span><strong>Max Diameter:</strong> {evt.imaging.max_diameter_mm} mm</span>
                          <span><strong>Tumor Vol:</strong> {evt.imaging.tumor_volume_cm3} cm³</span>
                          <span><strong>Tumor/Liver Ratio:</strong> {evt.imaging.tumor_liver_ratio_pct}%</span>
                          {evt.imaging.trend_status && (
                            <span className={`status-chip ${evt.imaging.trend_status === 'Increased' ? 'high' : 'low'}`}>
                              {evt.imaging.trend_status} {evt.imaging.volume_change_pct ? `(${evt.imaging.volume_change_pct > 0 ? '+' : ''}${evt.imaging.volume_change_pct}%)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {evt.ai_prediction && (
                      <div className="inline-ai-box">
                        <div className="ai-header">
                          <BrainCircuit size={16} style={{ color: '#ec4899' }} />
                          <strong>AI Prediction: {evt.ai_prediction.prediction}</strong>
                          <span className="ai-prob">{(evt.ai_prediction.probability * 100).toFixed(1)}% Risk</span>
                        </div>
                        {evt.ai_prediction.shap_features && (
                          <div className="shap-chips">
                            <span className="lbl">SHAP Drivers:</span>
                            {evt.ai_prediction.shap_features.map((f, i) => (
                              <span key={i} className="shap-chip">
                                {f.feature} (+{(f.weight * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {evt.details && (
                      <div className="event-meta-footer">
                        {Object.entries(evt.details).map(([k, v]) => (
                          <span key={k} className="meta-tag">
                            <em>{k.replace('_', ' ')}:</em> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── 6. COMPARE SCANS MODAL ─────────────────────────────────────────── */}
      {compareModalOpen && (
        <div className="modal-backdrop" onClick={() => setCompareModalOpen(false)}>
          <div className="modal-content compare-scans-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><GitCompare size={20} style={{ color: '#00f2fe' }} /> Side-by-Side Longitudinal Scan Comparison</h2>
              <button className="modal-close-btn" onClick={() => setCompareModalOpen(false)}><X size={18} /></button>
            </div>

            <div className="compare-selectors-bar">
              <div className="selector-col">
                <label>Select Scan A (Baseline / Prior):</label>
                <select value={scanAId || ''} onChange={e => setScanAId(e.target.value)}>
                  {imagingHistory.map(s => (
                    <option key={s.id} value={s.id}>{s.date} — {s.title} ({s.max_diameter_mm}mm)</option>
                  ))}
                </select>
              </div>

              <div className="vs-badge">VS</div>

              <div className="selector-col">
                <label>Select Scan B (Follow-up / Recent):</label>
                <select value={scanBId || ''} onChange={e => setScanBId(e.target.value)}>
                  {imagingHistory.map(s => (
                    <option key={s.id} value={s.id}>{s.date} — {s.title} ({s.max_diameter_mm}mm)</option>
                  ))}
                </select>
              </div>
            </div>

            {scanA && scanB ? (
              <div className="compare-side-by-side-grid">
                {/* Column A */}
                <div className="compare-card">
                  <div className="card-badge baseline">Scan A — {scanA.date}</div>
                  <h3>{scanA.title}</h3>
                  <p className="doc">{scanA.doctor}</p>

                  <div className="compare-img-box">
                    <img src={scanA.thumbnail || '/ct_scans/james_morrison_ct.jpg'} alt="Scan A" />
                    <span>{scanA.modality}</span>
                  </div>

                  <table className="compare-table">
                    <tbody>
                      <tr><td>Max Diameter</td><td><strong>{scanA.max_diameter_mm} mm</strong></td></tr>
                      <tr><td>Tumor Volume</td><td><strong>{scanA.tumor_volume_cm3} cm³</strong></td></tr>
                      <tr><td>Liver Volume</td><td><strong>{scanA.liver_volume_cm3} cm³</strong></td></tr>
                      <tr><td>Tumor/Liver Ratio</td><td><strong>{scanA.tumor_liver_ratio_pct}%</strong></td></tr>
                      <tr><td>Lesion Count</td><td><strong>{scanA.lesion_count}</strong></td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Column B */}
                <div className="compare-card">
                  <div className="card-badge recent">Scan B — {scanB.date}</div>
                  <h3>{scanB.title}</h3>
                  <p className="doc">{scanB.doctor}</p>

                  <div className="compare-img-box">
                    <img src={scanB.thumbnail || '/ct_scans/james_morrison_ct.jpg'} alt="Scan B" />
                    <span>{scanB.modality}</span>
                  </div>

                  <table className="compare-table">
                    <tbody>
                      <tr>
                        <td>Max Diameter</td>
                        <td>
                          <strong>{scanB.max_diameter_mm} mm</strong>
                          <small className={scanB.max_diameter_mm > scanA.max_diameter_mm ? 'delta-high' : 'delta-low'}>
                            ({(scanB.max_diameter_mm - scanA.max_diameter_mm).toFixed(1)} mm)
                          </small>
                        </td>
                      </tr>
                      <tr>
                        <td>Tumor Volume</td>
                        <td>
                          <strong>{scanB.tumor_volume_cm3} cm³</strong>
                          <small className={scanB.tumor_volume_cm3 > scanA.tumor_volume_cm3 ? 'delta-high' : 'delta-low'}>
                            ({(((scanB.tumor_volume_cm3 - scanA.tumor_volume_cm3) / scanA.tumor_volume_cm3) * 100).toFixed(1)}%)
                          </small>
                        </td>
                      </tr>
                      <tr><td>Liver Volume</td><td><strong>{scanB.liver_volume_cm3} cm³</strong></td></tr>
                      <tr><td>Tumor/Liver Ratio</td><td><strong>{scanB.tumor_liver_ratio_pct}%</strong></td></tr>
                      <tr><td>Lesion Count</td><td><strong>{scanB.lesion_count}</strong></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p>Please select two imaging studies to compare.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── 7. AI EVOLUTION MODAL ─────────────────────────────────────────── */}
      {aiEvolutionOpen && (
        <div className="modal-backdrop" onClick={() => setAiEvolutionOpen(false)}>
          <div className="modal-content ai-evolution-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Sparkles size={20} style={{ color: '#ec4899' }} /> AI Model Evolution & Explainability Telemetry</h2>
              <button className="modal-close-btn" onClick={() => setAiEvolutionOpen(false)}><X size={18} /></button>
            </div>

            <div className="ai-evolution-grid">
              {aiHistory.map((ai, i) => (
                <div key={ai.id || i} className="ai-evolution-card">
                  <div className="ai-card-top">
                    <span className="date">{ai.date}</span>
                    <span className="model-name">{ai.model_name} ({ai.model_version})</span>
                  </div>

                  <div className="ai-pred-row">
                    <strong>Prediction: {ai.prediction}</strong>
                    <span className="prob-badge">{(ai.probability * 100).toFixed(1)}% Probability</span>
                  </div>

                  {ai.shap_features && (
                    <div className="shap-list">
                      <span className="shap-lbl">SHAP Feature Drivers:</span>
                      {ai.shap_features.map((sf, idx) => (
                        <div key={idx} className="shap-item">
                          <span>{sf.feature}</span>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${Math.min(100, Math.abs(sf.weight * 200))}%` }} />
                          </div>
                          <strong>+{(sf.weight * 100).toFixed(0)}%</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {ai.gradcam && (
                    <div className="gradcam-preview">
                      <span>Grad-CAM Attention Map:</span>
                      <img src={ai.gradcam} alt="Grad-CAM" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. BEFORE VS AFTER MODAL ──────────────────────────────────────── */}
      {beforeAfterOpen && (
        <div className="modal-backdrop" onClick={() => setBeforeAfterOpen(false)}>
          <div className="modal-content before-after-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><LineChart size={20} style={{ color: '#10b981' }} /> Before vs After Intervention Assessment</h2>
              <button className="modal-close-btn" onClick={() => setBeforeAfterOpen(false)}><X size={18} /></button>
            </div>

            <div className="before-after-grid">
              <div className="ba-col before">
                <h3>Pre-Intervention Baseline (2025-11-20)</h3>
                <ul>
                  <li><strong>Serum AFP:</strong> 45.0 ng/mL</li>
                  <li><strong>Lesion Max Diameter:</strong> 21.0 mm</li>
                  <li><strong>Tumor Volume:</strong> 14.8 cm³</li>
                  <li><strong>LI-RADS Score:</strong> LR-4 (Probable HCC)</li>
                  <li><strong>ALBI Grade:</strong> Grade 1 (-2.45)</li>
                </ul>
              </div>

              <div className="ba-col intervention">
                <h3>Intervention Performed</h3>
                <div className="interv-box">
                  <strong>DEB-TACE + Systemic Immunotherapy</strong>
                  <p>Segment VI Drug-Eluting Bead Chemoembolization followed by Atezolizumab + Bevacizumab combination therapy.</p>
                </div>
              </div>

              <div className="ba-col after">
                <h3>Post-Intervention Outcome (2026-09-10)</h3>
                <ul>
                  <li><strong>Tumor Necrosis Rate:</strong> 75% Non-viable tissue</li>
                  <li><strong>Serum AFP:</strong> 940.0 ng/mL (Stabilized)</li>
                  <li><strong>Residual Enhancing Nodule:</strong> 28.0 mm</li>
                  <li><strong>Current Status:</strong> Stable disease on Cycle 4 Immunotherapy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. EVENT DETAILS DRAWER ───────────────────────────────────────── */}
      {selectedEvent && (
        <div className="drawer-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-cat">{selectedEvent.category_name || selectedEvent.category}</span>
                <h2>{selectedEvent.title}</h2>
                <span className="drawer-date">{selectedEvent.date}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}><X size={18} /></button>
            </div>

            <div className="drawer-body">
              <div className="drawer-row">
                <strong>Clinician / Author:</strong> <span>{selectedEvent.doctor}</span>
              </div>
              <div className="drawer-row">
                <strong>Data Source:</strong> <span>{selectedEvent.source}</span>
              </div>
              <div className="drawer-row">
                <strong>Summary:</strong> <p>{selectedEvent.summary}</p>
              </div>

              {selectedEvent.labs && (
                <div className="drawer-section">
                  <h3>Laboratory Biomarker Panel</h3>
                  <table className="drawer-table">
                    <tbody>
                      {Object.entries(selectedEvent.labs).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ textTransform: 'uppercase' }}>{k}</td>
                          <td><strong>{v}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedEvent.imaging && (
                <div className="drawer-section">
                  <h3>Volumetric CT/MRI DICOM Parameters</h3>
                  <table className="drawer-table">
                    <tbody>
                      {Object.entries(selectedEvent.imaging).map(([k, v]) => (
                        <tr key={k}>
                          <td>{k.replace('_', ' ')}</td>
                          <td><strong>{String(v)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedEvent.details && (
                <div className="drawer-section">
                  <h3>Audit Trail & Structured Metadata</h3>
                  <pre className="json-dump">{JSON.stringify(selectedEvent.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. ADD DOCTOR CLINICAL NOTE MODAL ────────────────────────────── */}
      {addNoteOpen && (
        <div className="modal-backdrop" onClick={() => setAddNoteOpen(false)}>
          <div className="modal-content add-note-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Plus size={20} style={{ color: '#00f2fe' }} /> Add Signed Clinical Note to Patient Timeline</h2>
              <button className="modal-close-btn" onClick={() => setAddNoteOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddNote} className="add-note-form">
              <div className="form-group">
                <label>Author / Clinician:</label>
                <input type="text" value="Dr. Riley Chen (Oncology Lead)" disabled />
              </div>

              <div className="form-group">
                <label>Clinical Observation / Follow-up Note:</label>
                <textarea
                  rows={5}
                  placeholder="Enter clinical progress note, treatment adjustments, or follow-up instructions..."
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setAddNoteOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submittingNote}>
                  {submittingNote ? 'Signing Note...' : 'Sign & Append Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SVG INTERACTIVE MULTI-BIOMARKER LINE CHART ─────────────────────────────
function BiomarkerSvgChart({ data, activeKeys }) {
  if (!data || data.length === 0) return <p className="no-data">No lab biomarker history available.</p>

  const width = 800
  const height = 220
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="biomarker-svg-element">
      <defs>
        {BIOMARKER_CONFIGS.map(b => (
          <linearGradient key={b.key} id={`grad-${b.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.0" />
          </linearGradient>
        ))}
      </defs>

      {/* Grid Lines */}
      {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
        const y = padding.top + innerH * frac
        return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      })}

      {/* X Axis Dates */}
      {data.map((d, idx) => {
        const x = padding.left + (idx / Math.max(1, data.length - 1)) * innerW
        return (
          <text key={idx} x={x} y={height - 12} fill="#9ca3af" fontSize="10" textAnchor="middle">
            {d.date}
          </text>
        )
      })}

      {/* Render Active Biomarker Lines */}
      {activeKeys.map(bKey => {
        const cfg = BIOMARKER_CONFIGS.find(b => b.key === bKey)
        if (!cfg) return null

        const values = data.map(d => Number(d[bKey]) || 0)
        const minV = Math.min(...values)
        const maxV = Math.max(...values, minV + 1)

        const points = data.map((d, idx) => {
          const x = padding.left + (idx / Math.max(1, data.length - 1)) * innerW
          const val = Number(d[bKey]) || 0
          const norm = (val - minV) / (maxV - minV || 1)
          const y = padding.top + (1 - norm) * innerH
          return { x, y, val, date: d.date }
        })

        const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '')

        return (
          <g key={bKey}>
            <path d={pathD} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill={cfg.color} stroke="#090d16" strokeWidth="2" />
                <text x={p.x} y={p.y - 8} fill="#fff" fontSize="9" textAnchor="middle" fontWeight="bold">
                  {p.val}
                </text>
              </g>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
