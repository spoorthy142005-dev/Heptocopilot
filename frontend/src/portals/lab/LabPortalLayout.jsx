import React, { useState } from 'react'
import {
  FlaskConical, ClipboardList, CheckCircle2, Clock, AlertTriangle, FileText,
  Upload, Sparkles, ShieldCheck, Settings, Bell, Menu, User, LogOut, Search, RefreshCw,
  Plus, Edit, Eye, Filter, Check, X, ArrowRight
} from 'lucide-react'

const LAB_NAV = [
  ['Dashboard',          FlaskConical],
  ['Patient Requests',    ClipboardList],
  ['Test Orders',         ClipboardList],
  ['Sample Management',   Clock],
  ['Lab Results',         FileText],
  ['Report Upload',       Upload],
  ['OCR Processing',      Sparkles],
  ['Verification',        ShieldCheck],
  ['History',             Clock],
  ['Notifications',       Bell],
  ['Profile',             User],
  ['Settings',            Settings]
]

export default function LabPortalLayout({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [notice, setNotice] = useState('')
  const [editingResult, setEditingResult] = useState(null)
  const [ocrVerified, setOcrVerified] = useState(false)

  const showNotice = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  return (
    <div className="app-shell lab-theme-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar lab-sidebar">
        <div className="brand lab-brand">
          <div className="brand-mark lab-mark"><FlaskConical size={20} /></div>
          <span>Pathology <span>Lab Portal</span></span>
        </div>
        <div className="workspace-label">LABORATORY WORKFLOW SYSTEM</div>
        <nav>
          {LAB_NAV.map(([label, Icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'nav-item active lab-active' : 'nav-item'}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} /><span>{label}</span>
              {label === 'OCR Processing' && <b style={{ background: '#06b6d4' }}>AI</b>}
              {label === 'Verification' && <b style={{ background: '#f59e0b' }}>3 Pending</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar lab-avatar">LT</div>
            <div>
              <strong>{user?.name || 'Tech Alex Mercer'}</strong>
              <small>Senior Pathologist</small>
            </div>
            <button className="logout-mini-btn" title="Sign Out" onClick={onLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar lab-topbar">
          <button className="mobile-menu"><Menu size={20} /></button>
          <div className="breadcrumb">
            Lab Portal <span>/</span> {activeNav}
          </div>
          <div className="header-actions">
            <span className="scan-status" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
              <span className="live-dot" style={{ background: '#06b6d4' }} /> LIMS Network Connected
            </span>
            <button className="icon-button" onClick={() => showNotice('LIMS Status: 28 samples processing in auto-analyzer')}><Bell size={18} /></button>
          </div>
        </header>

        <div className="content-wrap">
          {notice && (
            <div className="toast" style={{ borderColor: '#06b6d4' }}>
              <ShieldCheck size={18} style={{ color: '#06b6d4' }} /> {notice}
            </div>
          )}

          {/* ── 1. DASHBOARD ──────────────────────────────────────────────── */}
          {activeNav === 'Dashboard' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}>
                    <FlaskConical size={14} /> CLINICAL PATHOLOGY & DIAGNOSTIC WORKFLOW
                  </div>
                  <h1>Laboratory Sample & Verification Queue</h1>
                  <p>Process test requisitions, sample registration, automated OCR extraction, and technician sign-off.</p>
                </div>
                <button className="primary-button lab-primary-btn" onClick={() => showNotice('Synchronizing LIMS auto-analyzer test feed…')}>
                  <RefreshCw size={16} /> Sync LIMS Queue
                </button>
              </section>

              <section className="metric-grid">
                <div className="metric-card">
                  <div className="metric-top"><span>Pending Test Requests</span><div className="metric-icon blue"><Clock size={18} /></div></div>
                  <strong>12 Orders</strong>
                  <div className="metric-foot neutral">Awaiting Sample Collection</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>Samples Registered</span><div className="metric-icon cyan"><FlaskConical size={18} /></div></div>
                  <strong>28 In Pipeline</strong>
                  <div className="metric-foot positive">Serum AFP & Liver Panels</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>AI OCR Extractions</span><div className="metric-icon gold"><Sparkles size={18} /></div></div>
                  <strong>6 Extracted</strong>
                  <div className="metric-foot neutral">Requires Verification</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top"><span>Verified & Finalized</span><div className="metric-icon green"><CheckCircle2 size={18} /></div></div>
                  <strong>142 Reports</strong>
                  <div className="metric-foot positive">Synchronized to Doctor Portal</div>
                </div>
              </section>

              <section className="panel" style={{ marginTop: '20px' }}>
                <div className="panel-heading">
                  <div>
                    <h2>Laboratory Test Orders & Verification Queue</h2>
                    <p>Track order progression from request to verified doctor distribution</p>
                  </div>
                </div>

                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Patient Name & ID</th>
                      <th>Ordering Clinician</th>
                      <th>Test Requested</th>
                      <th>Sample Status</th>
                      <th>OCR Confidence</th>
                      <th>Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>ORD-99482</strong></td>
                      <td>James Morrison (PT-10482)</td>
                      <td>Dr. Riley Chen</td>
                      <td>Serum AFP + LFT Panel</td>
                      <td><span className="badge-tag cyan">Testing Complete</span></td>
                      <td><strong style={{ color: '#10b981' }}>98.2%</strong></td>
                      <td><button className="outline-button" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setActiveNav('Verification')}><ShieldCheck size={14} /> Verify & Sign</button></td>
                    </tr>
                    <tr>
                      <td><strong>ORD-99479</strong></td>
                      <td>Eleanor Vance (PT-10476)</td>
                      <td>Dr. Riley Chen</td>
                      <td>Liver Function & Albumin</td>
                      <td><span className="badge-tag gold">OCR Extracted</span></td>
                      <td><strong style={{ color: '#f59e0b' }}>94.6%</strong></td>
                      <td><button className="primary-button lab-primary-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setActiveNav('OCR Processing')}><Sparkles size={14} /> Review OCR</button></td>
                    </tr>
                    <tr>
                      <td><strong>ORD-99471</strong></td>
                      <td>Robert Chen (PT-10471)</td>
                      <td>Dr. Marcus Vance</td>
                      <td>Coagulation (INR, PT)</td>
                      <td><span className="badge-tag blue">Sample Registered</span></td>
                      <td><span style={{ color: 'var(--text-dim)' }}>Pending</span></td>
                      <td><span className="badge-tag gray">In Analysis</span></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 2. PATIENT REQUESTS ─────────────────────────────────────────── */}
          {activeNav === 'Patient Requests' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><ClipboardList size={14} /> DOCTOR REQUISITIONS</div>
                  <h1>Pending Test Requisitions</h1>
                  <p>Inbound lab test orders requested by attending hospital clinicians.</p>
                </div>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Requisition ID</th>
                      <th>Patient Name</th>
                      <th>Ordering Doctor</th>
                      <th>Requested Panels</th>
                      <th>Priority Level</th>
                      <th>Intake Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>REQ-88101</strong></td>
                      <td>James Morrison (PT-10482)</td>
                      <td>Dr. Riley Chen</td>
                      <td>Serum AFP, LFT, Platelets</td>
                      <td><span className="badge-tag red">STAT Urgent</span></td>
                      <td><button className="primary-button lab-primary-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => showNotice('Requisition REQ-88101 accepted into sample pipeline')}><Check size={14} /> Accept Request</button></td>
                    </tr>
                    <tr>
                      <td><strong>REQ-88094</strong></td>
                      <td>Eleanor Vance (PT-10479)</td>
                      <td>Dr. Riley Chen</td>
                      <td>Albumin, Bilirubin, INR</td>
                      <td><span className="badge-tag yellow">Routine Surveillance</span></td>
                      <td><button className="primary-button lab-primary-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => showNotice('Requisition REQ-88094 accepted into sample pipeline')}><Check size={14} /> Accept Request</button></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 3. TEST ORDERS ─────────────────────────────────────────────── */}
          {activeNav === 'Test Orders' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><ClipboardList size={14} /> TEST ORDER TRACKING</div>
                  <h1>Active Test Order Progression</h1>
                  <p>Track test execution from order placement to final sign-off.</p>
                </div>
              </section>

              <section className="metric-grid">
                <div className="metric-card"><span>Ordered</span><strong>12 Orders</strong><div className="metric-foot neutral">Pending specimen</div></div>
                <div className="metric-card"><span>Collected</span><strong>8 Specimens</strong><div className="metric-foot positive">In centrifuge</div></div>
                <div className="metric-card"><span>Processing</span><strong>14 Auto-runs</strong><div className="metric-foot positive">Roche Cobas e411</div></div>
                <div className="metric-card"><span>Completed</span><strong>142 Orders</strong><div className="metric-foot green">Signed & Synced</div></div>
              </section>
            </>
          )}

          {/* ── 4. SAMPLE MANAGEMENT ────────────────────────────────────────── */}
          {activeNav === 'Sample Management' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Clock size={14} /> BARCODE & SAMPLE TRACKING</div>
                  <h1>Specimen Inventory & Storage Tracking</h1>
                  <p>Register tube barcodes, specimen types, and freezer bay storage locations.</p>
                </div>
                <button className="primary-button lab-primary-btn" onClick={() => showNotice('Sample barcode scanner active')}>
                  <Plus size={16} /> Register New Specimen
                </button>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Specimen Barcode</th>
                      <th>Patient Name</th>
                      <th>Tube Type</th>
                      <th>Collection Time</th>
                      <th>Storage Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>BC-990482-A</strong></td>
                      <td>James Morrison</td>
                      <td>SST Gold (Serum)</td>
                      <td>Today, 08:30 AM</td>
                      <td>Freezer Bay 04 · Rack B2</td>
                      <td><span className="badge-tag green">Analyzed</span></td>
                    </tr>
                    <tr>
                      <td><strong>BC-990479-B</strong></td>
                      <td>Eleanor Vance</td>
                      <td>EDTA Purple (Whole Blood)</td>
                      <td>Today, 09:15 AM</td>
                      <td>Centrifuge Station 01</td>
                      <td><span className="badge-tag cyan">Spinning</span></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 5. LAB RESULTS ─────────────────────────────────────────────── */}
          {activeNav === 'Lab Results' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><FileText size={14} /> DIAGNOSTIC VALUES</div>
                  <h1>Laboratory Test Results Grid</h1>
                  <p>Detailed view of analyzed serum biomarkers and clinical reference ranges.</p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading"><h2>Patient PT-10482 — Serum & LFT Values</h2></div>
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Test Parameter</th>
                      <th>Measured Value</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Flag Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Alpha-Fetoprotein (AFP)</strong></td>
                      <td><strong style={{ color: '#ef4444' }}>940.0</strong></td>
                      <td>ng/mL</td>
                      <td>&lt; 20.0 ng/mL</td>
                      <td><span className="badge-tag red">CRITICAL HIGH</span></td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Biomarker value flag noted')}><Edit size={12} /> Edit</button></td>
                    </tr>
                    <tr>
                      <td><strong>Alanine Aminotransferase (ALT)</strong></td>
                      <td><strong style={{ color: '#f59e0b' }}>72.0</strong></td>
                      <td>U/L</td>
                      <td>7 - 56 U/L</td>
                      <td><span className="badge-tag yellow">HIGH</span></td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Biomarker value flag noted')}><Edit size={12} /> Edit</button></td>
                    </tr>
                    <tr>
                      <td><strong>Serum Albumin</strong></td>
                      <td><strong style={{ color: '#10b981' }}>3.2</strong></td>
                      <td>g/dL</td>
                      <td>3.5 - 5.0 g/dL</td>
                      <td><span className="badge-tag yellow">LOW</span></td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Biomarker value flag noted')}><Edit size={12} /> Edit</button></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 6. REPORT UPLOAD ───────────────────────────────────────────── */}
          {activeNav === 'Report Upload' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Upload size={14} /> DOCUMENT INTAKE</div>
                  <h1>Laboratory Report Upload & AI OCR Trigger</h1>
                  <p>Upload scanned paper reports or PDFs for automated structured data extraction.</p>
                </div>
              </section>

              <div className="panel report-card" style={{ textAlignment: 'center', padding: '40px', cursor: 'pointer' }} onClick={() => { showNotice('Report uploaded! OCR processing triggered…'); setActiveNav('OCR Processing'); }}>
                <div className="report-icon" style={{ margin: '0 auto 16px', width: '56px', height: '56px' }}><Upload size={28} /></div>
                <h2>Drag & Drop Scanned Lab PDF / Image</h2>
                <p>Supports PDF, PNG, JPG scanned pathology reports up to 25MB.</p>
                <button className="primary-button lab-primary-btn" style={{ margin: '0 auto' }}>
                  <Sparkles size={16} /> Upload & Run AI OCR Extraction
                </button>
              </div>
            </>
          )}

          {/* ── 7. OCR PROCESSING ──────────────────────────────────────────── */}
          {activeNav === 'OCR Processing' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Sparkles size={14} /> AI REPORT EXTRACTION</div>
                  <h1>AI OCR Extraction & Data Verification</h1>
                  <p>Compare original scanned document against AI-extracted structured laboratory fields.</p>
                </div>
              </section>

              <div className="report-grid">
                {/* Left Scanned PDF Document Mock */}
                <div className="panel" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '12px' }}>Original Scanned Lab Document</h3>
                  <div style={{ background: '#0f172a', border: '1px solid var(--border-color)', height: '280px', borderRadius: '8px', padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 'bold', color: '#fff' }}>NORTHSTAR PATHOLOGY CLINICAL REPORT</p>
                    <p>Patient: James Morrison (MRN-88401)</p>
                    <p>Test: Serum Alpha-Fetoprotein (AFP)</p>
                    <p>Result: 940 ng/mL [REF: &lt; 20 ng/mL]</p>
                    <p>ALT: 72 U/L | AST: 84 U/L</p>
                    <p>Albumin: 3.2 g/dL | Bilirubin: 1.8 mg/dL</p>
                  </div>
                </div>

                {/* Right Extracted Fields */}
                <div className="panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', color: '#fff' }}>AI Extracted Structured Fields</h3>
                    <span className="badge-tag yellow"><AlertTriangle size={12} /> Requires Verification</span>
                  </div>

                  <div className="setting-row"><span>Serum AFP</span><strong>940.0 ng/mL (98.2% conf)</strong></div>
                  <div className="setting-row"><span>ALT</span><strong>72 U/L (96.4% conf)</strong></div>
                  <div className="setting-row"><span>AST</span><strong>84 U/L (95.1% conf)</strong></div>
                  <div className="setting-row"><span>Albumin</span><strong>3.2 g/dL (97.8% conf)</strong></div>

                  <button className="primary-button lab-primary-btn" style={{ width: '100%', marginTop: '16px' }} onClick={() => { setOcrVerified(true); showNotice('OCR fields verified & sent to final sign-off queue!'); setActiveNav('Verification'); }}>
                    <ShieldCheck size={16} /> Confirm & Send to Verification
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── 8. VERIFICATION ────────────────────────────────────────────── */}
          {activeNav === 'Verification' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><ShieldCheck size={14} /> PATHOLOGIST SIGN-OFF</div>
                  <h1>Final Technician Sign-off Queue</h1>
                  <p>Formally verify and digitally sign off on laboratory results before publication to Doctor Portal.</p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading"><h2>Pending Sign-off Requisition ORD-99482</h2></div>
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>Patient: <strong>James Morrison (PT-10482)</strong> · Ordering Doctor: <strong>Dr. Riley Chen</strong></p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Verified Values: Serum AFP 940 ng/mL, ALT 72 U/L, Albumin 3.2 g/dL, INR 1.3</p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="primary-button lab-primary-btn" onClick={() => showNotice('Report ORD-99482 digitally signed & published to Doctor Portal!')}>
                      <ShieldCheck size={16} /> Digitally Sign & Finalize Report
                    </button>
                    <button className="outline-button" onClick={() => showNotice('Order returned to analyzer stage for re-testing')}>
                      Re-test Specimen
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── 9. HISTORY ─────────────────────────────────────────────────── */}
          {activeNav === 'History' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Clock size={14} /> ARCHIVED PATHOLOGY REPORTS</div>
                  <h1>Completed Report History</h1>
                  <p>Search and inspect verified historical lab reports.</p>
                </div>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Date Completed</th>
                      <th>Patient Name</th>
                      <th>Verified By</th>
                      <th>PDF Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>REP-LAB-8812</strong></td>
                      <td>2026-09-24</td>
                      <td>James Morrison</td>
                      <td>Tech Alex Mercer</td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Downloading archived lab report PDF…')}><FileText size={14} /> PDF</button></td>
                    </tr>
                    <tr>
                      <td><strong>REP-LAB-8809</strong></td>
                      <td>2026-09-22</td>
                      <td>Eleanor Vance</td>
                      <td>Tech Alex Mercer</td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Downloading archived lab report PDF…')}><FileText size={14} /> PDF</button></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 10. NOTIFICATIONS ──────────────────────────────────────────── */}
          {activeNav === 'Notifications' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Bell size={14} /> LAB ALERT CENTER</div>
                  <h1>Pathology Alerts & Critical Value Notifications</h1>
                  <p>Real-time notifications for critical lab values and doctor stat orders.</p>
                </div>
              </section>

              <div className="panel" style={{ padding: '20px' }}>
                <div className="setting-row"><span><strong>CRITICAL ALERT: Serum AFP &gt; 900 ng/mL</strong><small>Patient James Morrison (PT-10482) — Dr. Riley Chen notified</small></span><span className="badge-tag red">Critical</span></div>
                <div className="setting-row"><span><strong>STAT Order Accepted: REQ-88101</strong><small>Specimen received in centrifuge bay</small></span><span className="badge-tag cyan">Active</span></div>
                <div className="setting-row"><span><strong>OCR Engine Calibrated</strong><small>Extraction accuracy verified at 98.4%</small></span><span className="badge-tag green">Normal</span></div>
              </div>
            </>
          )}

          {/* ── 11. PROFILE ────────────────────────────────────────────────── */}
          {activeNav === 'Profile' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><User size={14} /> PATHOLOGIST CREDENTIALS</div>
                  <h1>Lab Technician Profile</h1>
                  <p>Technician credentials, digital signature settings, and active shift log.</p>
                </div>
              </section>

              <div className="panel setting-card" style={{ maxWidth: '600px' }}>
                <h2>{user?.name || 'Tech Alex Mercer'}</h2>
                <div className="setting-row"><span>License ID</span><strong>PATH-LIC-88401</strong></div>
                <div className="setting-row"><span>Role & Department</span><strong>Senior Pathologist · Clinical Lab</strong></div>
                <div className="setting-row"><span>Digital Signature</span><span className="badge-tag green">Verified RSA Key</span></div>
                <div className="setting-row"><span>Reports Signed Today</span><strong>18 Verified Reports</strong></div>
              </div>
            </>
          )}

          {/* ── 12. SETTINGS ───────────────────────────────────────────────── */}
          {activeNav === 'Settings' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#06b6d4' }}><Settings size={14} /> LIMS CONFIGURATION</div>
                  <h1>Laboratory System Settings</h1>
                  <p>Manage LIMS network connection, OCR extraction thresholds, and reference ranges.</p>
                </div>
              </section>

              <div className="settings-grid">
                <div className="panel setting-card">
                  <h2>LIMS Network Settings</h2>
                  <div className="setting-row"><span>LIMS Auto-Analyzer Feed</span><span className="badge-tag green">Connected (127.0.0.1:8000)</span></div>
                  <div className="setting-row"><span>Auto-Sync Interval</span><strong>5 Minutes</strong></div>
                </div>

                <div className="panel setting-card">
                  <h2>AI OCR Thresholds</h2>
                  <div className="setting-row"><span>Min Extraction Confidence</span><strong>90% Confidence</strong></div>
                  <div className="setting-row"><span>Mandatory Verification</span><span className="badge-tag yellow">Enabled</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
