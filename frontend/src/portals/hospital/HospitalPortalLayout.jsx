import React, { useState } from 'react'
import SubsystemPerformanceCard from '../../components/SubsystemPerformanceCard'
import DepartmentActivityTable from './DepartmentActivityTable'
import {
  Building2, Users, Stethoscope, FlaskConical, Layers, BrainCircuit,
  BarChart2, FileText, ShieldAlert, Settings, Bell, Menu, User, LogOut,
  Plus, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  ShieldCheck, Download, LockKeyhole, UserPlus, Filter, SlidersHorizontal
} from 'lucide-react'

const HOSPITAL_NAV = [
  ['Hospital Overview',       Building2],
  ['Departments',             Building2],
  ['Doctors',                 Stethoscope],
  ['Patients',                Users],
  ['Laboratory Integration',  FlaskConical],
  ['Imaging Center',          Layers],
  ['AI Analytics',            BrainCircuit],
  ['Case Statistics',         BarChart2],
  ['Reports',                 FileText],
  ['Audit Logs',              ShieldAlert],
  ['User Management',         Users],
  ['Settings',                Settings]
]

export default function HospitalPortalLayout({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('Hospital Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [notice, setNotice] = useState('')

  const showNotice = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  return (
    <div className="app-shell hospital-theme-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar hospital-sidebar">
        <div className="brand hospital-brand">
          <div className="brand-mark hospital-mark"><Building2 size={20} /></div>
          <span>Northstar <span>Hospital Admin</span></span>
        </div>
        <div className="workspace-label">HOSPITAL OPERATIONS PORTAL</div>
        <nav>
          {HOSPITAL_NAV.map(([label, Icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'nav-item active hospital-active' : 'nav-item'}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} /><span>{label}</span>
              {label === 'Audit Logs' && <b style={{ background: '#ef4444' }}>SECURE</b>}
              {label === 'AI Analytics' && <b style={{ background: '#3b82f6' }}>v2.4</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar hospital-avatar">HA</div>
            <div>
              <strong>{user?.name || 'Admin Sarah Jenkins'}</strong>
              <small>Operations Director</small>
            </div>
            <button className="logout-mini-btn" title="Sign Out" onClick={onLogout}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar hospital-topbar">
          <button className="mobile-menu"><Menu size={20} /></button>
          <div className="breadcrumb">
            Hospital Admin <span>/</span> {activeNav}
          </div>
          <div className="header-actions">
            <span className="scan-status" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
              <span className="live-dot" style={{ background: '#3b82f6' }} /> Shared FastAPI Backend Synchronized
            </span>
            <button className="icon-button" onClick={() => showNotice('System status: All hospital nodes operating at 100% capacity')}><Bell size={18} /></button>
          </div>
        </header>

        <div className="content-wrap">
          {notice && (
            <div className="toast" style={{ borderColor: '#3b82f6' }}>
              <ShieldCheck size={18} style={{ color: '#3b82f6' }} /> {notice}
            </div>
          )}

          {/* ── 1. HOSPITAL OVERVIEW ────────────────────────────────────────── */}
          {activeNav === 'Hospital Overview' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}>
                    <Building2 size={14} /> HOSPITAL ADMINISTRATIVE CONTROL PANEL
                  </div>
                  <h1>Hospital Operations Summary</h1>
                  <p>Real-time operational monitoring, clinical capacity tracking, and multi-department analytics.</p>
                </div>
                <button className="primary-button hospital-primary-btn" onClick={() => showNotice('Refreshing hospital operational metrics…')}>
                  <RefreshCw size={16} /> Refresh Metrics
                </button>
              </section>

              <section className="metric-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span>Total Patients Monitored</span>
                    <div className="metric-icon blue"><Users size={18} /></div>
                  </div>
                  <strong>1,284</strong>
                  <div className="metric-foot positive">+12.4% this month</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Active Doctors</span>
                    <div className="metric-icon green"><Stethoscope size={18} /></div>
                  </div>
                  <strong>42 Clinicians</strong>
                  <div className="metric-foot neutral">8 Departments Active</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>Lab Reports Processed</span>
                    <div className="metric-icon cyan"><FlaskConical size={18} /></div>
                  </div>
                  <strong>386 Orders</strong>
                  <div className="metric-foot positive">98.4% Verified</div>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>AI Assessments Flagged</span>
                    <div className="metric-icon coral"><BrainCircuit size={18} /></div>
                  </div>
                  <strong>47 High-Risk Cases</strong>
                  <div className="metric-foot neutral">Pending Doctor Sign-off</div>
                </div>
              </section>

              <DepartmentActivityTable onShowNotice={showNotice} />
            </>
          )}

          {/* ── 2. DEPARTMENTS ─────────────────────────────────────────────── */}
          {activeNav === 'Departments' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Building2 size={14} /> DEPARTMENT MANAGEMENT</div>
                  <h1>Hospital Department Roster & Staffing</h1>
                  <p>Overview of bed allocation, active physician count, and technology infrastructure.</p>
                </div>
                <button className="primary-button hospital-primary-btn" onClick={() => showNotice('New Department Creation Modal initialized')}>
                  <Plus size={16} /> Add Department
                </button>
              </section>

              <div className="report-grid">
                <div className="panel report-card">
                  <div className="report-icon"><Stethoscope size={24} /></div>
                  <h2>Hepatology & Gastro-Oncology</h2>
                  <p>Primary clinical unit for liver disease management, HCC surveillance, and clinical decision support.</p>
                  <div className="setting-row"><span>Beds Allocated: <strong>120 Beds</strong></span><span className="badge-tag green">92% Occupancy</span></div>
                  <div className="setting-row"><span>Attending Physicians: <strong>14 Doctors</strong></span><span className="badge-tag cyan">Active</span></div>
                </div>

                <div className="panel report-card">
                  <div className="report-icon"><Layers size={24} /></div>
                  <h2>Diagnostic Radiology & PACS</h2>
                  <p>Volumetric 3D CT/MRI scan processing, nnU-Net segmentation, and LI-RADS v2018 grading.</p>
                  <div className="setting-row"><span>Scanners Online: <strong>4 Scanners (Siemens 128-slice)</strong></span><span className="badge-tag green">100% Operational</span></div>
                  <div className="setting-row"><span>Radiology Staff: <strong>10 Radiologists</strong></span><span className="badge-tag cyan">Active</span></div>
                </div>

                <div className="panel report-card">
                  <div className="report-icon"><FlaskConical size={24} /></div>
                  <h2>Clinical Pathology & Laboratory</h2>
                  <p>Serum AFP, Liver Function Tests (LFTs), INR coagulation, and automated report OCR pipeline.</p>
                  <div className="setting-row"><span>LIMS Pipeline: <strong>24/7 Automated Feed</strong></span><span className="badge-tag green">Online</span></div>
                  <div className="setting-row"><span>Lab Technicians: <strong>8 Staff</strong></span><span className="badge-tag cyan">Active</span></div>
                </div>

                <div className="panel report-card">
                  <div className="report-icon"><BrainCircuit size={24} /></div>
                  <h2>AI & Clinical Informatics Unit</h2>
                  <p>Deployment of PyTorch ConvNeXt, Swin Transformer v2, and SHAP explainability telemetry.</p>
                  <div className="setting-row"><span>Model Version: <strong>v2.4 Calibrated</strong></span><span className="badge-tag green">91.4% AUC-ROC</span></div>
                  <div className="setting-row"><span>Informatics Team: <strong>4 Engineers</strong></span><span className="badge-tag cyan">Active</span></div>
                </div>
              </div>
            </>
          )}

          {/* ── 3. DOCTORS ─────────────────────────────────────────────────── */}
          {activeNav === 'Doctors' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Stethoscope size={14} /> MEDICAL STAFF CONTROL</div>
                  <h1>Hospital Physician & Specialist Directory</h1>
                  <p>Manage doctor permissions, active patient loads, and department assignments.</p>
                </div>
                <button className="primary-button hospital-primary-btn" onClick={() => showNotice('Physician Intake & Credentialing Form opened')}>
                  <UserPlus size={16} /> Onboard New Doctor
                </button>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>Active Clinical Staff Roster</h2>
                  <div className="toolbar-search-wrap" style={{ maxWidth: '300px' }}>
                    <Search size={16} className="toolbar-search-icon" />
                    <input type="text" placeholder="Search doctor name or ID…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                </div>

                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Doctor ID</th>
                      <th>Name & Credential</th>
                      <th>Specialty / Department</th>
                      <th>Assigned Patients</th>
                      <th>AI Usage</th>
                      <th>System Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>DOC-88401</strong></td>
                      <td>Dr. Riley Chen, MD</td>
                      <td>Hepatology & Oncology</td>
                      <td>42 Active Patients</td>
                      <td><span className="badge-tag cyan">High (194 runs)</span></td>
                      <td><span className="badge-tag green">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>DOC-88312</strong></td>
                      <td>Dr. Marcus Vance, MD</td>
                      <td>Diagnostic Radiology</td>
                      <td>28 Active Patients</td>
                      <td><span className="badge-tag cyan">High (142 scans)</span></td>
                      <td><span className="badge-tag green">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>DOC-88209</strong></td>
                      <td>Dr. Elena Rostova, MD</td>
                      <td>Interventional Radiology</td>
                      <td>18 Active Patients</td>
                      <td><span className="badge-tag blue">Medium (38 runs)</span></td>
                      <td><span className="badge-tag green">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>DOC-88104</strong></td>
                      <td>Dr. Jonathan Hayes, MD</td>
                      <td>Gastroenterology</td>
                      <td>34 Active Patients</td>
                      <td><span className="badge-tag blue">Medium (52 runs)</span></td>
                      <td><span className="badge-tag green">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 4. PATIENTS ─────────────────────────────────────────────────── */}
          {activeNav === 'Patients' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Users size={14} /> HOSPITAL PATIENT DIRECTORY</div>
                  <h1>Master Patient Registry</h1>
                  <p>Comprehensive hospital-wide patient directory with risk stratification and attending doctor assignments.</p>
                </div>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Full Name</th>
                      <th>Age / Gender</th>
                      <th>HCC Risk Score</th>
                      <th>Attending Physician</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PT-10482</strong></td>
                      <td>James Morrison</td>
                      <td>58 / Male</td>
                      <td><span className="badge-tag red">88% High Risk</span></td>
                      <td>Dr. Riley Chen</td>
                      <td>Hepatology & Oncology</td>
                    </tr>
                    <tr>
                      <td><strong>PT-10479</strong></td>
                      <td>Eleanor Vance</td>
                      <td>64 / Female</td>
                      <td><span className="badge-tag yellow">64% Moderate Risk</span></td>
                      <td>Dr. Riley Chen</td>
                      <td>Hepatology & Oncology</td>
                    </tr>
                    <tr>
                      <td><strong>PT-10476</strong></td>
                      <td>Robert Bailey</td>
                      <td>51 / Male</td>
                      <td><span className="badge-tag green">18% Low Risk</span></td>
                      <td>Dr. Marcus Vance</td>
                      <td>Diagnostic Radiology</td>
                    </tr>
                    <tr>
                      <td><strong>PT-10471</strong></td>
                      <td>Sofia Alvarez</td>
                      <td>71 / Female</td>
                      <td><span className="badge-tag red">76% High Risk</span></td>
                      <td>Dr. Elena Rostova</td>
                      <td>Interventional Radiology</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 5. LABORATORY INTEGRATION ──────────────────────────────────── */}
          {activeNav === 'Laboratory Integration' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><FlaskConical size={14} /> LIMS INTEGRATION NETWORK</div>
                  <h1>Laboratory System Data Pipelines</h1>
                  <p>Monitor real-time lab test requisitions, sample pipelines, and automated OCR verification.</p>
                </div>
              </section>

              <section className="metric-grid">
                <div className="metric-card"><span>Total Lab Orders</span><strong>386 Orders</strong><div className="metric-foot positive">100% Data Synced</div></div>
                <div className="metric-card"><span>Serum AFP Tests</span><strong>142 Tests</strong><div className="metric-foot neutral">Median: 240 ng/mL</div></div>
                <div className="metric-card"><span>OCR Verification Rate</span><strong>98.4%</strong><div className="metric-foot positive">Verified by Pathologists</div></div>
                <div className="metric-card"><span>Turnaround Time</span><strong>2.4 Hours</strong><div className="metric-foot positive">-45 mins vs last week</div></div>
              </section>
            </>
          )}

          {/* ── 6. IMAGING CENTER ───────────────────────────────────────────── */}
          {activeNav === 'Imaging Center' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Layers size={14} /> PACS & IMAGING CENTER</div>
                  <h1>Radiology Imaging Vault & Scanner Metrics</h1>
                  <p>Volumetric 3D CT/MRI DICOM storage, nnU-Net segmentation status, and scanner queue.</p>
                </div>
              </section>

              <section className="metric-grid">
                <div className="metric-card"><span>Total Imaging Studies</span><strong>186 CT/MRI Scans</strong><div className="metric-foot positive">PACS Synchronized</div></div>
                <div className="metric-card"><span>LI-RADS LR-5 Lesions</span><strong>42 Cases</strong><div className="metric-foot coral">High Malignancy Risk</div></div>
                <div className="metric-card"><span>nnU-Net 3D Segmentations</span><strong>186 Completed</strong><div className="metric-foot positive">Volumetric Accuracy: 94.2%</div></div>
                <div className="metric-card"><span>Active Scanners</span><strong>4 / 4 Online</strong><div className="metric-foot green">Siemens Healthineers</div></div>
              </section>
            </>
          )}

          {/* ── 7. AI ANALYTICS ─────────────────────────────────────────────── */}
          {activeNav === 'AI Analytics' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><BrainCircuit size={14} /> AI MODEL TELEMETRY</div>
                  <h1>Clinical AI Intelligence Analytics</h1>
                  <p>Model AUC-ROC performance, ConvNeXt pathology accuracy, and SHAP explainability metrics.</p>
                </div>
              </section>

              <SubsystemPerformanceCard />

              <div className="settings-grid">
                <div className="panel setting-card">
                  <h2>PyTorch Model Calibration</h2>
                  <div className="setting-row"><span>ConvNeXt Classifier Accuracy</span><strong>91.4% AUC-ROC</strong></div>
                  <div className="setting-row"><span>Swin Transformer v2 MVI Staging</span><strong>89.6% Accuracy</strong></div>
                  <div className="setting-row"><span>nnU-Net v2 Volumetric Dice Score</span><strong>0.92 Dice Index</strong></div>
                </div>

                <div className="panel setting-card">
                  <h2>AI Risk Distribution</h2>
                  <div className="setting-row"><span>High Risk Tier (HCC Prob &gt; 75%)</span><strong style={{ color: '#ef4444' }}>47 Patients (36.6%)</strong></div>
                  <div className="setting-row"><span>Moderate Risk Tier (35-75%)</span><strong style={{ color: '#f59e0b' }}>42 Patients (32.8%)</strong></div>
                  <div className="setting-row"><span>Low Risk Tier (&lt; 35%)</span><strong style={{ color: '#10b981' }}>39 Patients (30.4%)</strong></div>
                </div>
              </div>
            </>
          )}

          {/* ── 8. CASE STATISTICS ──────────────────────────────────────────── */}
          {activeNav === 'Case Statistics' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><BarChart2 size={14} /> CLINICAL EPIDEMIOLOGY</div>
                  <h1>Hepato-Oncology Case Statistics</h1>
                  <p>Patient population staging breakdown, BCLC classification, and longitudinal outcomes.</p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading"><h2>BCLC Stage & Pathology Distribution</h2></div>
                <div className="scores-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="score-card score-card-mint">
                    <span className="score-card-label">BCLC STAGE 0 / A</span>
                    <strong className="score-card-value">42%</strong>
                    <span className="score-card-desc">Early Stage / Resectable</span>
                  </div>
                  <div className="score-card score-card-coral">
                    <span className="score-card-label">BCLC STAGE B</span>
                    <strong className="score-card-value">34%</strong>
                    <span className="score-card-desc">Intermediate / TACE Eligible</span>
                  </div>
                  <div className="score-card score-card-coral">
                    <span className="score-card-label">BCLC STAGE C / D</span>
                    <strong className="score-card-value">24%</strong>
                    <span className="score-card-desc">Advanced / Systemic Therapy</span>
                  </div>
                  <div className="score-card score-card-mint">
                    <span className="score-card-label">5-YEAR SURVIVAL RATE</span>
                    <strong className="score-card-value">68.4%</strong>
                    <span className="score-card-desc">Multimodal Treatment</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── 9. REPORTS ──────────────────────────────────────────────────── */}
          {activeNav === 'Reports' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><FileText size={14} /> HOSPITAL AUDIT & REPORTS</div>
                  <h1>Hospital Administrative & Clinical Reports</h1>
                  <p>Downloadable PDF executive summaries, quality metrics, and departmental audits.</p>
                </div>
              </section>

              <div className="report-grid">
                <div className="panel report-card">
                  <div className="report-icon"><FileText size={24} /></div>
                  <h2>Monthly AI Diagnostic Quality Audit</h2>
                  <p>Comprehensive review of 186 AI risk assessments and clinician confirmation rates.</p>
                  <button className="primary-button hospital-primary-btn" onClick={() => showNotice('Downloading Executive AI Quality Report PDF…')}>
                    <Download size={15} /> Download PDF
                  </button>
                </div>

                <div className="panel report-card">
                  <div className="report-icon"><Building2 size={24} /></div>
                  <h2>Quarter 3 Hospital Operational Summary</h2>
                  <p>Bed occupancy, throughput statistics, and inter-department referral metrics.</p>
                  <button className="outline-button" onClick={() => showNotice('Generating Quarter 3 Operational Summary Report…')}>
                    <Download size={15} /> Download PDF
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── 10. AUDIT LOGS ──────────────────────────────────────────────── */}
          {activeNav === 'Audit Logs' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#ef4444' }}><ShieldAlert size={14} /> IMMUTABLE SECURITY AUDIT LOG</div>
                  <h1>System Security & Access Audit Trail</h1>
                  <p>Cryptographically hashed event log recording user access, data changes, and AI model executions.</p>
                </div>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User Account</th>
                      <th>Role</th>
                      <th>Action Performed</th>
                      <th>Resource / Patient ID</th>
                      <th>Security Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2026-09-25 12:24:10</td>
                      <td>Dr. Riley Chen</td>
                      <td><span className="badge-tag cyan">DOCTOR</span></td>
                      <td>Viewed Longitudinal Patient Timeline</td>
                      <td>Patient PT-10482</td>
                      <td><span className="badge-tag green">Authorized</span></td>
                    </tr>
                    <tr>
                      <td>2026-09-25 11:42:05</td>
                      <td>Tech Alex Mercer</td>
                      <td><span className="badge-tag yellow">LAB_ADMIN</span></td>
                      <td>Verified Lab Result & Signed Report</td>
                      <td>Lab Order ORD-99482</td>
                      <td><span className="badge-tag green">Authorized</span></td>
                    </tr>
                    <tr>
                      <td>2026-09-25 10:15:30</td>
                      <td>Dr. Marcus Vance</td>
                      <td><span className="badge-tag cyan">DOCTOR</span></td>
                      <td>Executed PyTorch ConvNeXt AI Classifier</td>
                      <td>Scan CT-88401</td>
                      <td><span className="badge-tag green">Authorized</span></td>
                    </tr>
                    <tr>
                      <td>2026-09-25 09:05:12</td>
                      <td>Admin Sarah Jenkins</td>
                      <td><span className="badge-tag red">HOSPITAL_ADMIN</span></td>
                      <td>Updated User Permission Scope</td>
                      <td>User DOC-88209</td>
                      <td><span className="badge-tag green">Authorized</span></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 11. USER MANAGEMENT ────────────────────────────────────────── */}
          {activeNav === 'User Management' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Users size={14} /> RBAC USER MANAGEMENT</div>
                  <h1>User Accounts & Access Control (RBAC)</h1>
                  <p>Manage user roles, disable/enable accounts, and assign fine-grained resource permissions.</p>
                </div>
                <button className="primary-button hospital-primary-btn" onClick={() => showNotice('Open user creation dialog')}>
                  <UserPlus size={16} /> Create User Account
                </button>
              </section>

              <section className="panel">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name & Email</th>
                      <th>Role Assignment</th>
                      <th>Department</th>
                      <th>Permissions</th>
                      <th>Account Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>USR-101</strong></td>
                      <td>Dr. Riley Chen<br /><small>dr.chen@northstar-health.org</small></td>
                      <td><span className="badge-tag cyan">DOCTOR</span></td>
                      <td>Hepatology & Oncology</td>
                      <td>clinical:write, ai:predict</td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Doctor permissions updated')}>Edit Access</button></td>
                    </tr>
                    <tr>
                      <td><strong>USR-102</strong></td>
                      <td>Admin Sarah Jenkins<br /><small>admin@northstar-health.org</small></td>
                      <td><span className="badge-tag red">HOSPITAL_ADMIN</span></td>
                      <td>Hospital Operations & IT</td>
                      <td>hospital:manage, users:manage</td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Admin permissions locked')}>Edit Access</button></td>
                    </tr>
                    <tr>
                      <td><strong>USR-103</strong></td>
                      <td>Tech Alex Mercer<br /><small>lab.tech@northstar-health.org</small></td>
                      <td><span className="badge-tag yellow">LAB_ADMIN</span></td>
                      <td>Clinical Pathology Lab</td>
                      <td>lab:write, ocr:process</td>
                      <td><button className="outline-button" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showNotice('Lab technician permissions updated')}>Edit Access</button></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </>
          )}

          {/* ── 12. SETTINGS ───────────────────────────────────────────────── */}
          {activeNav === 'Settings' && (
            <>
              <section className="page-intro">
                <div>
                  <div className="eyebrow" style={{ color: '#3b82f6' }}><Settings size={14} /> SYSTEM CONFIGURATION</div>
                  <h1>Hospital Platform Settings</h1>
                  <p>Manage shared FastAPI backend connection, database backup, and encryption options.</p>
                </div>
              </section>

              <div className="settings-grid">
                <div className="panel setting-card">
                  <h2>Backend Service Integration</h2>
                  <div className="setting-row"><span>FastAPI Server Endpoint</span><strong>http://127.0.0.1:8000</strong></div>
                  <div className="setting-row"><span>JWT Authentication Mode</span><span className="badge-tag green">Strict RBAC</span></div>
                  <div className="setting-row"><span>PostgreSQL Connection Pool</span><span className="badge-tag green">Active (20 conns)</span></div>
                </div>

                <div className="panel setting-card">
                  <h2>Security & Compliance</h2>
                  <div className="setting-row"><span>HIPAA Audit Trail Encryption</span><span className="badge-tag green">AES-256 Enabled</span></div>
                  <div className="setting-row"><span>Session Timeout</span><strong>30 Minutes</strong></div>
                  <div className="setting-row"><span>Automated Backup Schedule</span><strong>Daily 02:00 UTC</strong></div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
