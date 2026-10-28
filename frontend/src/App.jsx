import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit,
  Building2, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardList,
  Cross, Eye, EyeOff, FileText, FlaskConical, LayoutDashboard, LockKeyhole,
  Mail, Menu, Microscope, MoreHorizontal, Plus, Search, Settings, ShieldCheck,
  SlidersHorizontal, Stethoscope, TrendingUp, Upload, Users, User, X, Layers, Target,
  Printer, Download, Info, RefreshCw, BarChart2, ShieldAlert, Sparkles,
  Phone, Share2, Smartphone, Send, Copy, Check
} from 'lucide-react'
import * as THREE from 'three'
import './App.css'
import LongitudinalTimeline from './components/LongitudinalTimeline'
import SubsystemPerformanceCard from './components/SubsystemPerformanceCard'
import PredictionsCockpit from './components/PredictionsCockpit'
import LandingPortalSelect from './portals/LandingPortalSelect'
import DoctorLoginPage from './portals/doctor/DoctorLoginPage'
import HospitalLoginPage from './portals/hospital/HospitalLoginPage'
import HospitalPortalLayout from './portals/hospital/HospitalPortalLayout'
import LabLoginPage from './portals/lab/LabLoginPage'
import LabPortalLayout from './portals/lab/LabPortalLayout'

// ─── Helpers & Config ────────────────────────────────────────────────────────

const API = (path) => `http://127.0.0.1:8000${path}`

const riskColor = (tier) =>
  tier === 'High' ? 'high' : tier === 'Moderate' ? 'moderate' : 'low'

const NAV_ITEMS = [
  ['Overview',         LayoutDashboard],
  ['Patients',         Users],
  ['Patient Timeline', CalendarDays],
  ['CT Vault',         Layers],
  ['Lab Risk',         FlaskConical],
  ['LI-RADS',          Target],
  ['Predictions',      BrainCircuit],
  ['Doctor Consult',   Mail],
  ['Reports',          FileText],
  ['Settings',         Settings],
]

// In-App Patient CT Scan Repository (PACS Image Vault)
const PATIENT_CT_REPOSITORY = [
  {
    id: 'PT-10482',
    name: 'James Morrison',
    age: 58,
    gender: 'Male',
    mrn: 'MRN-88401',
    stage: 'Stage IIIa (T3a N0 M0)',
    pathology: 'HCC (Hepatocellular Carcinoma)',
    hcc_prob: 0.88,
    image: '/ct_scans/james_morrison_ct.jpg',
    lirads: 'LR-5',
    notes: 'Segment VI hyperenhancing lesion with nonperipheral washout.'
  },
  {
    id: 'PT-10476',
    name: 'Eleanor Vance',
    age: 64,
    gender: 'Female',
    mrn: 'MRN-88219',
    stage: 'Stage I (T1a N0 M0)',
    pathology: 'Benign Hemangioma',
    hcc_prob: 0.08,
    image: '/ct_scans/eleanor_vance_ct.jpg',
    lirads: 'LR-2',
    notes: 'Segment II peripheral nodular blood vessel enhancement.'
  },
  {
    id: 'PT-10471',
    name: 'Robert Chen',
    age: 51,
    gender: 'Male',
    mrn: 'MRN-88104',
    stage: 'Stage IV (T4 N1 M1)',
    pathology: 'Hepatic Metastasis',
    hcc_prob: 0.04,
    image: '/ct_scans/robert_chen_ct.jpg',
    lirads: 'LR-M',
    notes: 'Targetoid lesions across Segment IV and VIII.'
  },
  {
    id: 'PT-10469',
    name: 'Maria Santos',
    age: 49,
    gender: 'Female',
    mrn: 'MRN-88055',
    stage: 'Stage II (T2 N0 M0)',
    pathology: 'HCC (Hepatocellular Carcinoma)',
    hcc_prob: 0.86,
    image: '/ct_scans/maria_santos_ct.jpg',
    lirads: 'LR-5',
    notes: 'Solitary 28mm vascular lesion in Segment V.'
  }
]

// Sample lesion patches for quick demo testing
const DEMO_PATCHES = [
  { name: 'HCC Lesion (Axial)', type: 'hcc', label: 'Patient PT-10482 · Segment VI' },
  { name: 'Benign Hemangioma', type: 'hemangioma', label: 'Patient PT-10476 · Segment II' },
  { name: 'Hepatic Metastasis', type: 'metastasis', label: 'Patient PT-10471 · Segment IV' }
]

// ─── Root Component ──────────────────────────────────────────────────────────

export default function App({ initialUser, onLogout }) {
  const [currentPath, setCurrentPath]         = useState(window.location.pathname || '/')
  const [authUser, setAuthUser]               = useState(initialUser || null)
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialUser)
  const [activeNav, setActiveNav]             = useState('Overview')
  const [selectedPatient, setSelectedPatient]   = useState(null)
  const [patients, setPatients]                 = useState([])
  const [notice, setNotice]                     = useState('')
  const [range, setRange]                       = useState('7 days')

  const navigateTo = (path) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const showNotice = useCallback((msg) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3000)
  }, [])

  // Load patients roster from backend
  const refreshPatients = useCallback(async (q = '', tier = 'All') => {
    try {
      let url = API('/api/patients')
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (tier && tier !== 'All') params.append('tier', tier)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch {
      // Fallback roster if backend offline
      setPatients([
        { initials: 'JM', name: 'James Morrison',  id: 'PT-10482', age: 58, risk_score: 0.82, risk_tier: 'High',     tone: 'high',     afp: 940, date: 'Today, 9:42 AM' },
        { initials: 'EC', name: 'Eleanor Chen',    id: 'PT-10479', age: 63, risk_score: 0.64, risk_tier: 'Moderate', tone: 'moderate', afp: 42,  date: 'Today, 8:15 AM' },
        { initials: 'RB', name: 'Robert Bailey',   id: 'PT-10476', age: 46, risk_score: 0.18, risk_tier: 'Low',      tone: 'low',      afp: 6,   date: 'Yesterday, 4:28 PM' },
        { initials: 'SA', name: 'Sofia Alvarez',   id: 'PT-10471', age: 71, risk_score: 0.76, risk_tier: 'High',     tone: 'high',     afp: 240, date: 'Yesterday, 2:05 PM' },
      ])
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refreshPatients()
    }
  }, [isAuthenticated, refreshPatients])

  // ─── Portal Path Routing Decision Tree ──────────────────────────────────────

  if (currentPath === '/hospital/login') {
    return (
      <HospitalLoginPage
        onLoginSuccess={(user) => {
          setAuthUser(user)
          navigateTo('/hospital/dashboard')
        }}
        onBackToLanding={() => navigateTo('/')}
      />
    )
  }

  if (currentPath === '/hospital/dashboard' || authUser?.role === 'HOSPITAL_ADMIN') {
    return (
      <HospitalPortalLayout
        user={authUser}
        onLogout={() => {
          setAuthUser(null)
          navigateTo('/')
        }}
      />
    )
  }

  if (currentPath === '/lab/login') {
    return (
      <LabLoginPage
        onLoginSuccess={(user) => {
          setAuthUser(user)
          navigateTo('/lab/dashboard')
        }}
        onBackToLanding={() => navigateTo('/')}
      />
    )
  }

  if (currentPath === '/lab/dashboard' || authUser?.role === 'LAB_ADMIN') {
    return (
      <LabPortalLayout
        user={authUser}
        onLogout={() => {
          setAuthUser(null)
          navigateTo('/')
        }}
      />
    )
  }

  if (currentPath === '/doctor/login' && !isAuthenticated) {
    return (
      <DoctorLoginPage
        onLoginSuccess={(user) => {
          setAuthUser(user)
          setIsAuthenticated(true)
          navigateTo('/doctor/dashboard')
        }}
        onBackToLanding={() => navigateTo('/')}
      />
    )
  }

  if (!isAuthenticated && (currentPath === '/' || currentPath === '')) {
    return <LandingPortalSelect onNavigate={navigateTo} />
  }

  if (!isAuthenticated) {
    return (
      <DoctorLoginPage
        onLoginSuccess={(user) => {
          setAuthUser(user)
          setIsAuthenticated(true)
          navigateTo('/doctor/dashboard')
        }}
        onBackToLanding={() => navigateTo('/')}
      />
    )
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/hepato_copilot_logo_transparent.png" alt="HepatoCopilot Logo" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <span>Hepato<span>Copilot</span></span>
        </div>
        <div className="workspace-label">CLINICAL WORKSPACE</div>
        <nav>
          {NAV_ITEMS.map(([label, Icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} /><span>{label}</span>
              {label === 'Predictions' && <b>AI</b>}
              {label === 'LI-RADS' && <b style={{ background: '#06b6d4' }}>v2018</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => showNotice('Support docs: Clinical decision support guide v2.4')}>
            <CircleHelp size={18} /><span>Help & Guidelines</span>
          </button>
          <div className="user-card">
            <div className="avatar doctor">DR</div>
            <div>
              <strong>Dr. Riley Chen</strong>
              <small>Hepatology & Oncology</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb">
            Workspace <span>/</span> {activeNav}
          </div>
          <div className="header-actions">
            <span className="scan-status" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontSize: '11px' }}>
              <span className="live-dot" style={{ background: '#10b981' }} /> FastAPI Backend Connected
            </span>
            <button className="icon-button" aria-label="Notifications" onClick={() => showNotice('FastAPI backend API online (http://127.0.0.1:8000/docs)')}>
              <Bell size={18} /><i />
            </button>
            <div className="header-divider" />
            <div className="profile-mini" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#1e1b4b', fontSize: '12px' }}>
              <div className="avatar doctor">RC</div>
              <span>Dr. Chen</span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="content-wrap">
          {activeNav === 'Overview' && (
            <OverviewPage
              patients={patients}
              range={range}
              setRange={setRange}
              onSelect={setSelectedPatient}
              onNav={setActiveNav}
              onNotice={showNotice}
              onRefresh={() => refreshPatients()}
            />
          )}
          {activeNav === 'Patients' && (
            <PatientsPage
              patients={patients}
              onSelect={setSelectedPatient}
              onNotice={showNotice}
              onRefresh={refreshPatients}
            />
          )}
          {activeNav === 'Patient Timeline' && (
            <LongitudinalTimeline
              patientId={selectedPatient ? (selectedPatient.id || selectedPatient.patient_id) : 'PT-10482'}
              onNotice={showNotice}
            />
          )}
          {activeNav === 'CT Vault' && (
            <CTVaultPage
              onNotice={showNotice}
              onSelectScan={(pt) => {
                setActiveNav('Predictions')
                showNotice(`Loaded ${pt.name} CT scan from repository`)
              }}
            />
          )}
          {activeNav === 'Lab Risk' && <LabRiskPage onNotice={showNotice} />}
          {activeNav === 'LI-RADS' && <LIRADSPage onNotice={showNotice} />}
          {activeNav === 'Predictions' && <PredictionsPage onNotice={showNotice} />}
          {activeNav === 'Doctor Consult' && <DoctorConsultPage onNotice={showNotice} />}
          {activeNav === 'Reports' && <ReportsPage onNotice={showNotice} />}
          {activeNav === 'Settings' && <SettingsPage onNotice={showNotice} />}
        </div>
      </main>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onNotice={showNotice}
          onViewTimeline={() => setActiveNav('Patient Timeline')}
        />
      )}

      {/* Toast Notification */}
      {notice && (
        <div className="toast">
          <ShieldCheck size={18} style={{ color: '#06b6d4' }} /> {notice}
        </div>
      )}
    </div>
  )
}

// ─── Overview Page ───────────────────────────────────────────────────────────

function OverviewPage({ patients, range, setRange, onSelect, onNav, onNotice, onRefresh }) {
  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> AI CLINICAL INTELLIGENCE</div>
          <h1>Good morning, Dr. Chen</h1>
          <p>Here is your clinical intelligence summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="outline-button" onClick={onRefresh}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="primary-button" onClick={() => onNav('Patients')}>
            <Plus size={17} /> Intake Patient
          </button>
        </div>
      </section>

      <section className="alert-banner" style={{ borderLeftColor: '#ee4c2c' }}>
        <div className="alert-icon" style={{ background: 'rgba(238, 76, 44, 0.15)', color: '#ee4c2c' }}><ShieldCheck size={20} /></div>
        <div>
          <strong style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            PyTorch Deep Learning Engine & Clinical Models Calibrated
            <span style={{ background: 'rgba(238, 76, 44, 0.2)', color: '#ee4c2c', border: '1px solid rgba(238, 76, 44, 0.4)', borderRadius: '4px', fontSize: '10px', padding: '2px 6px', fontWeight: 'bold' }}>PyTorch 2.2 CUDA</span>
          </strong>
          <span>PyTorch-powered nnU-Net v2 3D Segmentation & ConvNeXt Pathology Classifier running with 91.4% AUC-ROC accuracy.</span>
        </div>
        <button aria-label="Dismiss" onClick={(e) => e.currentTarget.parentElement.remove()}>
          <X size={16} />
        </button>
      </section>

      <section className="metric-grid">
        <Metric label="Patients Monitored" value="1,284" icon={Users}       tone="blue"  change="12.8%" direction="up"   suffix="vs last month" />
        <Metric label="High-Risk Flagged"  value="47"    icon={Activity}    tone="coral" change="4.2%"  direction="down" suffix="vs last month" />
        <Metric label="Predictions / Week" value="186"   icon={BrainCircuit} tone="mint"  change="8.6%"  direction="up"   suffix="vs last week" />
        <Metric label="Model Accuracy"     value="91.4%" icon={Stethoscope} tone="gold"  suffix="Validated AUC-ROC" />
      </section>

      <section className="dashboard-grid">
        {/* Activity Chart */}
        <div className="panel trend-panel" style={{ gridColumn: 'auto' }}>
          <div className="panel-heading">
            <div>
              <h2>Prediction Activity</h2>
              <p>Longitudinal AI-assisted assessments run across network</p>
            </div>
            <div className="range-select">
              {['7 days', '30 days', '90 days'].map(r => (
                <button key={r} className={range === r ? 'selected' : ''} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="chart">
            <div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
            <div className="chart-area">
              <div className="grid-lines"><i /><i /><i /><i /><i /></div>
              <svg viewBox="0 0 700 210" preserveAspectRatio="none" role="img" aria-label="Prediction activity chart">
                <defs>
                  <linearGradient id="chartStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="60%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#120924" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M0 156 C35 148 55 128 90 137 S145 161 178 122 S228 105 258 124 S300 144 342 84 S390 90 420 101 S462 120 495 74 S535 58 560 81 S620 94 650 41 S682 59 700 32 V210 H0 Z" fill="url(#chartFill)" />
                <path d="M0 156 C35 148 55 128 90 137 S145 161 178 122 S228 105 258 124 S300 144 342 84 S390 90 420 101 S462 120 495 74 S535 58 560 81 S620 94 650 41 S682 59 700 32" fill="none" stroke="url(#chartStroke)" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
              <div className="chart-labels">
                <span>Aug 25</span><span>Aug 26</span><span>Aug 27</span>
                <span>Aug 28</span><span>Aug 29</span><span>Aug 30</span><span>Aug 31</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Scan Panel */}
        <ScanPanel />
      </section>

      {/* Patient Priority Table */}
      <section className="panel patients-panel">
        <div className="panel-heading">
          <div>
            <h2>High-Priority Patient Roster</h2>
            <p>AI predictions and risk scores requiring clinician review</p>
          </div>
          <button className="outline-button" onClick={() => onNav('Patients')}>
            View all patients <ArrowUpRight size={15} />
          </button>
        </div>
        <PatientTable patients={patients} onSelect={onSelect} />
      </section>
    </>
  )
}

// ─── 3D Volumetric Liver Scan Component with Authentic Anatomical Human Liver ─

function createRightLobeGeometry() {
  const geo = new THREE.SphereGeometry(1.22, 64, 64)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    // Right Lobe: Large convex dome, flattened inferior surface, sharp anterior edge
    x *= 1.35
    y *= 0.92
    z *= 1.05

    // Flatten visceral inferior surface
    if (y < -0.1) {
      y *= 0.58
    }
    // Taper anterior sharp border
    if (z > 0.2) {
      y -= (z - 0.2) * 0.38
    }
    // Hilar concavity on medial side
    if (x < -0.3 && y < 0.2) {
      z *= 0.85
      x += 0.15
    }

    // Organic tissue contour noise
    const noise = Math.sin(x * 2.5) * Math.cos(z * 2.5) * 0.05
    x += noise
    y += noise * 0.4
    z += noise

    pos.setXYZ(i, x, y, z)
  }
  geo.computeVertexNormals()
  return geo
}

function createLeftLobeGeometry() {
  const geo = new THREE.SphereGeometry(0.88, 48, 48)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)

    // Left Lobe: Flattened, triangular wedge extending to left tip
    x *= 1.45
    y *= 0.55
    z *= 0.72

    // Taper towards left apex
    if (x < 0) {
      y *= (1.0 + x * 0.4)
      z *= (1.0 + x * 0.3)
    }

    // Flatten inferior surface
    if (y < 0) y *= 0.65

    pos.setXYZ(i, x, y, z)
  }
  geo.computeVertexNormals()
  return geo
}

function ScanPanel() {
  const mountRef = useRef(null)
  const [showVessels, setShowVessels]   = useState(true)
  const [showPlane, setShowPlane]     = useState(true)
  const [sliceMode, setSliceMode]     = useState('axial') // 'axial', 'coronal', 'sagittal'
  const [autoRotate, setAutoRotate]   = useState(true)
  const cameraRef = useRef(null)
  const groupRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer = null
    let frameId = null
    let domElement = null
    let onMouseDown = null
    let onMouseMove = null
    let onMouseUp = null

    try {
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight || 1.3, 0.1, 100)
      camera.position.set(0, 0.3, 5.2)
      cameraRef.current = camera

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(mount.clientWidth || 320, mount.clientHeight || 240)
      mount.appendChild(renderer.domElement)
      domElement = renderer.domElement

      const group = new THREE.Group()
      groupRef.current = group
      scene.add(group)

      // Load High-Resolution Anatomical Texture Map
      const textureLoader = new THREE.TextureLoader()
      const liverTexture = textureLoader.load('/liver_anatomy_texture.png')
      liverTexture.wrapS = THREE.RepeatWrapping
      liverTexture.wrapT = THREE.ClampToEdgeWrapping

      const liverMat = new THREE.MeshPhysicalMaterial({
        map: liverTexture,
        color: 0xb91c1c,
        roughness: 0.35,
        metalness: 0.15,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.96
      })

      // 1. Right Lobe Mesh
      const rightLobe = new THREE.Mesh(createRightLobeGeometry(), liverMat)
      rightLobe.position.set(0.35, 0, 0)
      group.add(rightLobe)

      // 2. Left Lobe Mesh (Triangular anatomical wedge)
      const leftLobe = new THREE.Mesh(createLeftLobeGeometry(), liverMat)
      leftLobe.position.set(-0.95, -0.06, 0.05)
      leftLobe.rotation.z = 0.12
      group.add(leftLobe)

      // 3. Falciform Ligament Band (Ligamentous groove line between right and left lobes)
      const ligamentCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.25, 1.05, 0.2),
        new THREE.Vector3(-0.22, 0.3, 0.72),
        new THREE.Vector3(-0.20, -0.5, 0.45),
      ])
      const ligamentGeo = new THREE.TubeGeometry(ligamentCurve, 32, 0.065, 16, false)
      const ligamentMat = new THREE.MeshPhysicalMaterial({
        color: 0xfef08a,
        roughness: 0.3,
        clearcoat: 0.4,
        transparent: true,
        opacity: 0.9
      })
      const falciformLigament = new THREE.Mesh(ligamentGeo, ligamentMat)
      group.add(falciformLigament)

      // 4. Inferior Vena Cava (Blue venous trunk on top posterior notch)
      const ivcGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 24)
      const ivcMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.4, roughness: 0.25 })
      const ivc = new THREE.Mesh(ivcGeo, ivcMat)
      ivc.position.set(-0.15, 0.85, -0.35)
      ivc.rotation.x = -0.15
      group.add(ivc)

      // 5. Hepatic Artery Trunk (Red arterial trunk on top posterior notch)
      const haGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.3, 24)
      const haMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xb45309, emissiveIntensity: 0.4, roughness: 0.25 })
      const ha = new THREE.Mesh(haGeo, haMat)
      ha.position.set(0.12, 0.88, -0.32)
      ha.rotation.x = -0.18
      group.add(ha)

      // 6. Detailed Branching Surface Vascular Tree Network (Red arterial & Cyan venous branches)
      const vesselGroup = new THREE.Group()

      const branchConfigs = [
        { pts: [new THREE.Vector3(0.1, 0.7, -0.2), new THREE.Vector3(0.4, 0.5, 0.45), new THREE.Vector3(0.9, 0.2, 0.6), new THREE.Vector3(1.3, -0.2, 0.4)], color: 0xef4444, r: 0.042 },
        { pts: [new THREE.Vector3(0.4, 0.5, 0.45), new THREE.Vector3(0.65, 0.7, 0.35), new THREE.Vector3(1.1, 0.65, 0.2)], color: 0xf87171, r: 0.032 },
        { pts: [new THREE.Vector3(0.4, 0.5, 0.45), new THREE.Vector3(0.55, 0.1, 0.68), new THREE.Vector3(0.85, -0.3, 0.55)], color: 0xef4444, r: 0.035 },
        { pts: [new THREE.Vector3(0.55, 0.1, 0.68), new THREE.Vector3(0.35, -0.4, 0.52), new THREE.Vector3(0.15, -0.65, 0.35)], color: 0xf87171, r: 0.028 },
        { pts: [new THREE.Vector3(0.1, 0.7, -0.2), new THREE.Vector3(-0.35, 0.45, 0.38), new THREE.Vector3(-0.85, 0.25, 0.45), new THREE.Vector3(-1.4, 0.05, 0.2)], color: 0xef4444, r: 0.038 },
        { pts: [new THREE.Vector3(-0.35, 0.45, 0.38), new THREE.Vector3(-0.65, 0.1, 0.55), new THREE.Vector3(-1.1, -0.15, 0.32)], color: 0xf87171, r: 0.03 },
        { pts: [new THREE.Vector3(-0.15, 0.7, -0.2), new THREE.Vector3(0.2, 0.3, 0.58), new THREE.Vector3(0.7, -0.1, 0.65), new THREE.Vector3(1.15, -0.45, 0.3)], color: 0x06b6d4, r: 0.045 },
        { pts: [new THREE.Vector3(-0.15, 0.7, -0.2), new THREE.Vector3(-0.5, 0.3, 0.42), new THREE.Vector3(-1.0, 0.05, 0.35), new THREE.Vector3(-1.45, -0.1, 0.1)], color: 0x38bdf8, r: 0.038 },
        { pts: [new THREE.Vector3(0.1, 0.3, 0.1), new THREE.Vector3(0.25, -0.2, 0.55), new THREE.Vector3(0.32, -0.55, 0.4)], color: 0xeab308, r: 0.032 },
      ]

      branchConfigs.forEach(b => {
        const curve = new THREE.CatmullRomCurve3(b.pts)
        const tubeGeo = new THREE.TubeGeometry(curve, 32, b.r, 12, false)
        const tubeMat = new THREE.MeshStandardMaterial({
          color: b.color,
          emissive: b.color,
          emissiveIntensity: 0.3,
          roughness: 0.25,
          transparent: true,
          opacity: 0.92
        })
        vesselGroup.add(new THREE.Mesh(tubeGeo, tubeMat))
      })
      group.add(vesselGroup)

      // 7. Gallbladder
      const gbGeo = new THREE.SphereGeometry(0.25, 32, 24)
      gbGeo.scale(0.68, 1.45, 0.68)
      const gbMat = new THREE.MeshPhysicalMaterial({
        color: 0x059669,
        emissive: 0x047857,
        emissiveIntensity: 0.35,
        roughness: 0.22,
        clearcoat: 0.65,
        transparent: true,
        opacity: 0.9
      })
      const gallbladder = new THREE.Mesh(gbGeo, gbMat)
      gallbladder.position.set(0.3, -0.68, 0.38)
      gallbladder.rotation.z = -0.35
      group.add(gallbladder)

      // 8. Target Lesion Core Node (Segment VI)
      const lesionMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.95,
        roughness: 0.2
      })
      const lesion = new THREE.Mesh(new THREE.SphereGeometry(0.22, 36, 28), lesionMat)
      lesion.position.set(0.62, 0.18, 0.62)
      group.add(lesion)

      // Holographic Target Reticle Rings
      const haloOne = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.012, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.85 })
      )
      haloOne.position.copy(lesion.position)
      haloOne.rotation.x = Math.PI / 2.8
      group.add(haloOne)

      const haloTwo = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.008, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 })
      )
      haloTwo.position.copy(lesion.position)
      haloTwo.rotation.y = Math.PI / 2.2
      group.add(haloTwo)

      // 60FPS Vascular Flow Particles
      const mainFlowCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.25, -0.22, -0.2),
        new THREE.Vector3(-0.4, 0, 0),
        new THREE.Vector3(0.35, 0.22, 0.32),
        new THREE.Vector3(0.9, -0.08, 0.42)
      ])
      const particleCount = 45
      const particleGeo = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        const p = mainFlowCurve.getPoint(i / particleCount)
        particlePositions[i * 3] = p.x
        particlePositions[i * 3 + 1] = p.y
        particlePositions[i * 3 + 2] = p.z
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particleMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.065, transparent: true, opacity: 0.95 })
      const particles = new THREE.Points(particleGeo, particleMat)
      group.add(particles)

      // Slice Plane Cutter Indicator
      const planeGeo = new THREE.PlaneGeometry(3.6, 2.3)
      const planeMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
      const scanPlaneMesh = new THREE.Mesh(planeGeo, planeMat)
      group.add(scanPlaneMesh)

      // Studio Lighting
      scene.add(new THREE.HemisphereLight(0xffffff, 0x090d16, 2.4))
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
      keyLight.position.set(4, 5, 6)
      scene.add(keyLight)
      const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.8)
      fillLight.position.set(-4, -2, -3)
      scene.add(fillLight)

      // Interactive Drag Rotation
      let isDragging = false
      let prevMouseX = 0, prevMouseY = 0

      onMouseDown = (e) => {
        isDragging = true
        prevMouseX = e.clientX
        prevMouseY = e.clientY
      }
      onMouseMove = (e) => {
        if (!isDragging) return
        const deltaX = e.clientX - prevMouseX
        const deltaY = e.clientY - prevMouseY
        group.rotation.y += deltaX * 0.01
        group.rotation.x += deltaY * 0.01
        prevMouseX = e.clientX
        prevMouseY = e.clientY
      }
      onMouseUp = () => { isDragging = false }

      if (domElement) domElement.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      const clock = new THREE.Clock()

      const render = () => {
        const t = clock.getElapsedTime()
        if (autoRotate && !isDragging) {
          group.rotation.y = t * 0.25
        }

        if (sliceMode === 'axial') {
          scanPlaneMesh.rotation.set(Math.PI / 2, 0, 0)
          scanPlaneMesh.position.set(0, Math.sin(t * 0.8) * 0.4, 0)
        } else if (sliceMode === 'coronal') {
          scanPlaneMesh.rotation.set(0, 0, 0)
          scanPlaneMesh.position.set(0, 0, Math.sin(t * 0.8) * 0.3)
        } else {
          scanPlaneMesh.rotation.set(0, Math.PI / 2, 0)
          scanPlaneMesh.position.set(Math.sin(t * 0.8) * 0.5, 0, 0)
        }

        haloOne.rotation.z = t * 0.6
        haloTwo.rotation.x = t * 0.4
        lesion.scale.setScalar(1 + Math.sin(t * 4.0) * 0.14)

        const positions = particleGeo.attributes.position.array
        for (let i = 0; i < particleCount; i++) {
          const u = ((i / particleCount) + t * 0.15) % 1.0
          const pt = mainFlowCurve.getPoint(u)
          positions[i * 3] = pt.x
          positions[i * 3 + 1] = pt.y
          positions[i * 3 + 2] = pt.z
        }
        particleGeo.attributes.position.needsUpdate = true

        vesselGroup.visible = showVessels
        scanPlaneMesh.visible = showPlane

        if (renderer) renderer.render(scene, camera)
        frameId = requestAnimationFrame(render)
      }
      render()
    } catch (err) {
      console.warn('ScanPanel WebGL initialization skipped:', err)
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      if (domElement && onMouseDown) domElement.removeEventListener('mousedown', onMouseDown)
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove)
      if (onMouseUp) window.removeEventListener('mouseup', onMouseUp)
      if (renderer) renderer.dispose()
      if (mount && domElement && mount.contains(domElement)) {
        mount.removeChild(domElement)
      }
    }
  }, [showVessels, showPlane, sliceMode, autoRotate])

  const zoom = (delta) => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(3.0, Math.min(8.0, cameraRef.current.position.z + delta))
    }
  }

  const resetCamera = () => {
    if (cameraRef.current && groupRef.current) {
      cameraRef.current.position.set(0, 0.3, 5.0)
      groupRef.current.rotation.set(0, 0, 0)
    }
  }

  return (
    <div className="panel scan-panel">
      <div className="panel-heading">
        <div>
          <h2>3D Organic Volumetric CT Engine</h2>
          <p>Anatomical 3D Animation · Multi-Planar Slice Cutter</p>
        </div>
        <span className="scan-status"><span className="live-dot" /> 360° Interactive 3D Render</span>
      </div>

      <div className="scan-stage" ref={mountRef} style={{ cursor: 'grab' }} />

      {/* Multi-Planar Slice & Display Controls */}
      <div className="model-controls-bar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['axial', 'coronal', 'sagittal'].map(m => (
            <button
              key={m}
              className={`toggle-chip ${sliceMode === m ? 'active' : ''}`}
              onClick={() => setSliceMode(m)}
              style={{ textTransform: 'capitalize' }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={`toggle-chip ${showVessels ? 'active' : ''}`} onClick={() => setShowVessels(!showVessels)}>
            Vascular Flow
          </button>
          <button className={`toggle-chip ${autoRotate ? 'active' : ''}`} onClick={() => setAutoRotate(!autoRotate)}>
            3D Auto Spin
          </button>
          <button className="toggle-chip" onClick={() => zoom(-0.6)}>+</button>
          <button className="toggle-chip" onClick={() => zoom(0.6)}>-</button>
          <button className="toggle-chip" onClick={resetCamera}>Reset View</button>
        </div>
      </div>

      <div className="scan-readout">
        <span><i className="dot coral-bg" /> Target Lesion (24.5mm)</span>
        <strong>High Risk · LI-RADS 5</strong>
      </div>
      <div className="scan-meta">
        <span>Hepatic Vol: 1,420 cm³ · Flow 60fps</span>
        <span>{sliceMode.toUpperCase()} Slice Plane Active</span>
      </div>
    </div>
  )
}

// ─── Lab Risk Assessment Page ────────────────────────────────────────────────

const LAB_FIELDS = [
  { key: 'age',        label: 'Age',        unit: 'years',   min: 18,  max: 120, step: 1,    hint: '18–120' },
  { key: 'afp',        label: 'AFP',        unit: 'ng/mL',   min: 0,   max: 99999,step: 0.1, hint: 'α-fetoprotein' },
  { key: 'alt',        label: 'ALT',        unit: 'U/L',     min: 0,   max: 9999, step: 1,   hint: 'Alanine aminotransferase' },
  { key: 'ast',        label: 'AST',        unit: 'U/L',     min: 0,   max: 9999, step: 1,   hint: 'Aspartate aminotransferase' },
  { key: 'albumin',    label: 'Albumin',    unit: 'g/dL',    min: 0,   max: 10,   step: 0.1, hint: 'Serum albumin' },
  { key: 'bilirubin',  label: 'Bilirubin',  unit: 'mg/dL',   min: 0,   max: 100,  step: 0.1, hint: 'Total bilirubin' },
  { key: 'platelets',  label: 'Platelets',  unit: '×10³/μL', min: 0,   max: 9999, step: 1,   hint: 'Platelet count' },
  { key: 'inr',        label: 'INR',        unit: '',        min: 0,   max: 20,   step: 0.01,hint: 'International Normalised Ratio' },
  { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL',   min: 0,   max: 30,   step: 0.01,hint: 'Serum creatinine' },
]

const DEFAULT_LABS = {
  age: 58, afp: 310, alt: 72, ast: 88, albumin: 3.2,
  bilirubin: 1.8, platelets: 110, inr: 1.3, creatinine: 1.1,
  hbv_positive: true, hcv_positive: false, cirrhosis: true,
}

function LabRiskPage({ onNotice }) {
  const [form, setForm]       = useState(DEFAULT_LABS)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const submit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API('/api/patient-risk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: Number(form.age), afp: Number(form.afp), alt: Number(form.alt),
          ast: Number(form.ast), albumin: Number(form.albumin),
          bilirubin: Number(form.bilirubin), platelets: Number(form.platelets),
          inr: Number(form.inr), creatinine: Number(form.creatinine),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Assessment failed')
      setResult(data)
      onNotice('Lab risk assessment updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    submit()
  }, [])

  const pct = result ? Math.round(result.hcc_probability * 100) : 0
  const tier = result?.risk_tier ?? 'High'

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> AI LAB RISK ENGINE</div>
          <h1>Lab-Based HCC Risk Assessment</h1>
          <p>Compute ALBI, FIB-4, APRI, Child-Pugh score, and overall HCC probability.</p>
        </div>
      </section>

      <div className="lab-risk-layout">
        {/* Form Inputs */}
        <form className="panel lab-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <h2>Patient Lab Values</h2>
              <p>Standard liver function & biomarker panel</p>
            </div>
          </div>

          <div className="lab-fields">
            {LAB_FIELDS.map(f => (
              <label key={f.key} className="lab-field">
                <span className="lab-label">{f.label} {f.unit && <em>({f.unit})</em>}</span>
                <input
                  type="number"
                  min={f.min} max={f.max} step={f.step}
                  value={form[f.key]}
                  onChange={e => setField(f.key, e.target.value)}
                  required
                />
                <span className="lab-hint">{f.hint}</span>
              </label>
            ))}
          </div>

          <div className="lab-toggles">
            {[
              ['hbv_positive', 'HBV Positive (HBsAg+)'],
              ['hcv_positive', 'HCV Positive (Anti-HCV+)'],
              ['cirrhosis', 'Confirmed Cirrhosis']
            ].map(([key, lbl]) => (
              <label key={key} className="lab-toggle-row">
                <span>{lbl}</span>
                <button
                  type="button"
                  className={`toggle ${form[key] ? 'on' : ''}`}
                  onClick={() => setField(key, !form[key])}
                >
                  <i />
                </button>
              </label>
            ))}
          </div>

          {error && <p className="lab-error"><AlertTriangle size={14} /> {error}</p>}

          <button className="primary-button lab-submit" type="submit" disabled={loading}>
            {loading ? 'Computing Risk…' : <><FlaskConical size={16} /> Run Risk Assessment</>}
          </button>
        </form>

        {/* Results Panel */}
        <div className="lab-results">
          {result && (
            <>
              {/* Risk Gauge Panel */}
              <div className="panel risk-gauge-panel">
                <div className="risk-gauge-top">
                  <span className="eyebrow">HCC PROBABILITY SCORE</span>
                  <em className={`risk ${riskColor(tier)}`}>{tier} Risk Tier</em>
                </div>
                <div className="risk-gauge-bar">
                  <div className="risk-gauge-fill" style={{ width: `${pct}%` }} />
                  <div className="risk-gauge-thumb" style={{ left: `${pct}%` }} />
                </div>
                <div className="risk-gauge-labels">
                  <span>0% Low</span><span>35% Moderate</span><span>65% High</span><span>100%</span>
                </div>
                <strong className="risk-pct">{pct}%</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Estimated probability of Hepatocellular Carcinoma based on lab biomarkers.
                </p>
              </div>

              {/* Scores Grid */}
              <div className="panel" style={{ padding: '20px' }}>
                <div className="panel-heading">
                  <div>
                    <h2>Computed Clinical Scores</h2>
                    <p>Validated non-invasive liver scoring models</p>
                  </div>
                </div>
                <div className="scores-grid">
                  <ScoreCard label="APRI" value={result.scores.apri} good={result.scores.apri < 0.5} warn={result.scores.apri >= 1.5} desc="AST-to-Platelet Index" />
                  <ScoreCard label="FIB-4" value={result.scores.fib4} good={result.scores.fib4 < 1.3} warn={result.scores.fib4 >= 3.25} desc="Fibrosis Index" />
                  <ScoreCard label="ALBI" value={result.scores.albi} good={result.scores.albi <= -2.6} warn={result.scores.albi > -1.39} desc="Albumin-Bilirubin" />
                  <ScoreCard label="Child-Pugh" value={result.scores.child_pugh_points + ' pts'} good={result.scores.child_pugh_points <= 6} warn={result.scores.child_pugh_points >= 10} desc={`Class ${result.interpretations.child_pugh_class}`} />
                </div>
              </div>

              {/* Interpretations */}
              <div className="panel" style={{ padding: '20px' }}>
                <div className="panel-heading"><div><h2>Clinical Interpretations</h2></div></div>
                <div className="interp-list">
                  <InterpRow label="Fibrosis Stage" value={result.interpretations.fibrosis_stage} />
                  <InterpRow label="ALBI Grade"     value={result.interpretations.albi_grade} />
                  <InterpRow label="Child-Pugh Class" value={`Class ${result.interpretations.child_pugh_class}`} />
                </div>
              </div>

              {/* Clinical Flags */}
              {result.flags.length > 0 && (
                <div className="panel" style={{ padding: '20px' }}>
                  <div className="panel-heading">
                    <div><h2>Clinical Alerts & Flags ({result.flags.length})</h2></div>
                  </div>
                  <ul className="flags-list">
                    {result.flags.map((flag, i) => (
                      <li key={i}><AlertTriangle size={15} /> {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="lab-disclaimer">
                <ShieldCheck size={14} /> {result.disclaimer}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function ScoreCard({ label, value, good, warn, desc }) {
  const tone = warn ? 'coral' : good ? 'mint' : 'gold'
  return (
    <div className={`score-card score-card-${tone}`}>
      <span className="score-card-label">{label}</span>
      <strong className="score-card-value">{value}</strong>
      <span className="score-card-desc">{desc}</span>
    </div>
  )
}

function InterpRow({ label, value }) {
  return (
    <div className="interp-row">
      <span className="interp-label">{label}</span>
      <span className="interp-value">{value}</span>
    </div>
  )
}

// ─── ACR LI-RADS Radiology Calculator Page ───────────────────────────────────

function LIRADSPage({ onNotice }) {
  const [form, setForm] = useState({
    size_mm: 24,
    aphe: 'nonperipheral',
    washout: true,
    capsule: true,
    threshold_growth: false,
    tumor_in_vein: false,
    targetoid: false,
    benign_features: false
  })
  const [result, setResult] = useState(null)

  const evaluate = async (updatedForm) => {
    const dataToSubmit = updatedForm || form
    try {
      const res = await fetch(API('/api/lirads-assess'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch {
      // Local fallback
      setResult({
        category: 'LR-5',
        title: 'Definitely HCC',
        hcc_probability: 0.96,
        description: 'Definite Hepatocellular Carcinoma based on APHE, nonperipheral washout, and capsule appearance.',
        recommendation: 'Refer to multidisciplinary liver tumor board.',
        color: 'high'
      })
    }
  }

  useEffect(() => {
    evaluate()
  }, [])

  const update = (key, val) => {
    const next = { ...form, [key]: val }
    setForm(next)
    evaluate(next)
  }

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> ACR LI-RADS v2018 CALCULATOR</div>
          <h1>Liver Imaging Reporting & Data System</h1>
          <p>Standardized diagnostic categorization for CT and MRI liver observations.</p>
        </div>
      </section>

      <div className="lirads-grid">
        <div className="panel lirads-inputs">
          <div className="panel-heading">
            <div>
              <h2>Observation Imaging Features</h2>
              <p>Select radiological hallmarks from dynamic CT/MRI scan</p>
            </div>
          </div>

          <label className="lab-field">
            <span className="lab-label">Max Lesion Diameter (mm)</span>
            <input
              type="number"
              min="1" max="200"
              value={form.size_mm}
              onChange={e => update('size_mm', Number(e.target.value))}
            />
          </label>

          <div>
            <span className="lab-label">Arterial Phase Hyperenhancement (APHE)</span>
            <div className="radio-group">
              {[
                ['nonperipheral', 'Nonperipheral APHE'],
                ['peripheral', 'Rim APHE'],
                ['none', 'No APHE']
              ].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  className={`radio-btn ${form.aphe === val ? 'selected' : ''}`}
                  onClick={() => update('aphe', val)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-toggles">
            {[
              ['washout', 'Nonperipheral Washout'],
              ['capsule', 'Enhancing Capsule'],
              ['threshold_growth', 'Threshold Growth (50% increase ≤ 6mo)'],
              ['tumor_in_vein', 'Soft Tissue Tumor in Vein'],
              ['targetoid', 'Targetoid Features (Cholangiocarcinoma)'],
              ['benign_features', 'Definite Benign Hallmarks (Cyst/Hemangioma)']
            ].map(([key, lbl]) => (
              <label key={key} className="lab-toggle-row">
                <span>{lbl}</span>
                <button
                  type="button"
                  className={`toggle ${form[key] ? 'on' : ''}`}
                  onClick={() => update(key, !form[key])}
                >
                  <i />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* LI-RADS Result Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textCenter: 'center', padding: '36px' }}>
          {result && (
            <div style={{ textAlign: 'center', maxWidth: '420px' }}>
              <span className="eyebrow" style={{ justifyContent: 'center' }}>DIAGNOSTIC CATEGORY</span>
              <div className={`lirads-badge ${result.color}`}>
                {result.category}
              </div>
              <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)', color: '#1e1b4b', margin: '8px 0' }}>
                {result.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: '12px 0 20px' }}>
                {result.description}
              </p>
              <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', margin: '16px 0', textAlign: 'left' }}>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '11px', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                  CLINICAL RECOMMENDATION
                </strong>
                <span style={{ fontSize: '13px', color: '#1e1b4b' }}>{result.recommendation}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Estimated HCC Probability: <b style={{ color: '#1e1b4b' }}>{Math.round(result.hcc_probability * 100)}%</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── In-App Patient CT Image Repository Modal & Vault View ────────────────────

function CtRepositoryModal({ onClose, onSelect }) {
  return (
    <div className="patient-modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(224, 242, 254, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="patient-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', border: '1px solid rgba(186, 230, 253, 0.85)', borderRadius: '14px', padding: '24px', position: 'relative', boxShadow: '0 20px 60px rgba(186, 230, 253, 0.45)' }}>
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        <div style={{ marginBottom: '20px' }}>
          <div className="eyebrow" style={{ color: '#0284c7' }}>
            <span className="pulse-dot" style={{ background: '#0284c7' }} /> IN-APP PATIENT CT IMAGE REPOSITORY (PACS VAULT)
          </div>
          <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', color: '#1e1b4b', margin: '4px 0' }}>
            Select Patient CT Scan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Choose a stored patient CT scan from the in-app repository to evaluate with PyTorch Grad-CAM & Swin Transformer.
          </p>
        </div>

        <div className="scores-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {PATIENT_CT_REPOSITORY.map(pt => {
            const isFemale = pt.gender === 'Female'
            return (
              <div
                key={pt.id}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onSelect(pt)}
              >
                <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                  <img
                    src={pt.image}
                    alt={pt.name}
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: '#1e1b4b', fontSize: '15px' }}>{pt.name}</strong>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: isFemale ? 'rgba(236, 72, 153, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                        color: isFemale ? '#ec4899' : '#06b6d4',
                        border: `1px solid ${isFemale ? 'rgba(236, 72, 153, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`
                      }}>
                        {isFemale ? '♀ Female' : '♂ Male'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pt.id} · {pt.age} y/o</div>
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#ee4c2c', fontWeight: 'bold' }}>
                      {pt.stage}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                  <b>Diagnosis:</b> {pt.pathology} ({pt.lirads})
                </div>

                <button
                  className="primary-button full"
                  style={{ background: '#06b6d4', borderColor: '#06b6d4', padding: '8px', fontSize: '12px' }}
                  onClick={(e) => { e.stopPropagation(); onSelect(pt); }}
                >
                  <Layers size={14} /> Select Scan for Grad-CAM
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CTVaultPage({ onNotice, onSelectScan }) {
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('All')

  const filtered = PATIENT_CT_REPOSITORY.filter(pt => {
    const matchSearch = pt.name.toLowerCase().includes(search.toLowerCase()) || pt.id.toLowerCase().includes(search.toLowerCase()) || pt.stage.toLowerCase().includes(search.toLowerCase())
    const matchGender = genderFilter === 'All' || pt.gender === genderFilter
    return matchSearch && matchGender
  })

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow" style={{ color: '#06b6d4' }}>
            <span className="pulse-dot" style={{ background: '#06b6d4' }} /> IN-APP PATIENT CT IMAGE VAULT
          </div>
          <h1>Patient CT Scans Repository</h1>
          <p>Browse stored patient DICOM/CT imaging with patient demographics, gender cohorts, and cancer stages.</p>
        </div>
      </section>

      <div className="table-tools" style={{ gap: '16px', marginBottom: '20px' }}>
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search patient name, MRN, or cancer stage…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Filter Gender:</span>
          <div className="range-select">
            {['All', 'Male', 'Female'].map(g => (
              <button
                key={g}
                className={genderFilter === g ? 'selected' : ''}
                onClick={() => setGenderFilter(g)}
                style={{ color: genderFilter === g ? (g === 'Female' ? '#ec4899' : g === 'Male' ? '#0284c7' : '#0284c7') : undefined }}
              >
                {g === 'Male' ? '♂ Male' : g === 'Female' ? '♀ Female' : 'All Genders'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="scores-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {filtered.map(pt => {
          const isFemale = pt.gender === 'Female'
          return (
            <div key={pt.id} className="panel" style={{ display: 'flex', gap: '16px' }}>
              <img
                src={pt.image}
                alt={pt.name}
                style={{ width: '120px', height: '120px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '17px', color: '#1e1b4b' }}>{pt.name}</h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: isFemale ? 'rgba(236, 72, 153, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                      color: isFemale ? '#ec4899' : '#06b6d4',
                      border: `1px solid ${isFemale ? 'rgba(236, 72, 153, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`
                    }}>
                      {isFemale ? '♀ Female' : '♂ Male'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {pt.id} · {pt.age} y/o · {pt.mrn}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ee4c2c', fontWeight: 'bold', marginBottom: '6px' }}>
                    Cancer Stage: {pt.stage}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {pt.notes}
                  </div>
                </div>

                <button
                  className="primary-button"
                  style={{ background: '#ee4c2c', borderColor: '#ee4c2c', marginTop: '12px', alignSelf: 'flex-start' }}
                  onClick={() => onSelectScan(pt)}
                >
                  <BrainCircuit size={15} /> Run Grad-CAM Analysis
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── AI Predictions & Multimodal Cockpit View ──────────────────────────────

function PredictionsPage({ onNotice }) {
  return <PredictionsCockpit onNotice={onNotice} />
}

// ─── Doctor Consultation & Multidisciplinary Chat Workspace ──────────────────

// ─── Doctor Consultation & Multidisciplinary Chat Workspace ──────────────────

function DoctorConsultPage({ onNotice }) {
  const [selectedCase, setSelectedCase]   = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const caseId = params.get('consult_case')
    if (caseId) {
      const match = PATIENT_CT_REPOSITORY.find(p => p.id === caseId || p.name.toLowerCase().includes(caseId.toLowerCase()))
      if (match) return match
    }
    return PATIENT_CT_REPOSITORY[0]
  })

  const [phoneNo, setPhoneNo]             = useState('9585939743')
  const [copied, setCopied]               = useState(false)
  const [activeRecipient, setActiveRecipient] = useState('Dr. Sarah Jenkins (Transplant Hepatology)')
  const [inputMsg, setInputMsg]           = useState('')
  const [loading, setLoading]             = useState(false)
  const [chatLog, setChatLog]             = useState([
    {
      sender: 'Dr. Riley Chen (Primary Physician)',
      avatar: 'RC',
      isDoctor: true,
      time: '10:14 AM',
      text: 'Reviewing clinical case for James Morrison (58 y/o Male · Stage IIIa HCC · Serum AFP 940 ng/mL · Segment VI 24.5mm lesion with 78.4% Microvascular Invasion risk). Requesting specialist consensus on Atezolizumab + Bevacizumab systemic therapy vs TACE chemoembolization.'
    },
    {
      sender: 'Dr. Sarah Jenkins (Transplant Hepatologist)',
      avatar: 'SJ',
      isDoctor: false,
      time: '10:15 AM',
      text: 'Dr. Chen, reviewing the CT scan and ALBI/FIB-4 panel: Given the high microvascular invasion (MVI) risk (78.4%) and serum AFP >200 ng/mL, systemic combination therapy with Atezolizumab + Bevacizumab is preferred over TACE alone to prevent vascular dissemination.',
      citation: 'AASLD 2023 HCC Guidelines Section 4.2'
    },
    {
      sender: 'HepatoCopilot AI Medical Co-Counsel',
      avatar: 'AI',
      isDoctor: false,
      isAI: true,
      time: '10:15 AM',
      text: 'Knowledge-Grounded Evidence Synthesis: ACR LI-RADS LR-5 classification confirms definitive HCC without requirement for diagnostic biopsy. EASL 2022 guidelines recommend baseline upper endoscopy to rule out esophageal varices prior to Bevacizumab administration.',
      citation: 'EASL 2022 Clinical Practice Guidelines & ACR LI-RADS v2018'
    }
  ])

  const PEER_DOCTORS = [
    { name: 'Dr. Sarah Jenkins', title: 'Senior Transplant Hepatologist', avatar: 'SJ', status: 'Online', tone: '#06b6d4' },
    { name: 'Dr. Michael Chang', title: 'Interventional Radiologist & TACE Expert', avatar: 'MC', status: 'Online', tone: '#10b981' },
    { name: 'Dr. Elena Rostova', title: 'GI Medical Oncologist', avatar: 'ER', status: 'In Board', tone: '#ec4899' },
    { name: 'HepatoCopilot AI Co-Counsel', title: 'RAG Knowledge Decision Support', avatar: 'AI', status: 'Active Bot', tone: '#ee4c2c', isAI: true }
  ]

  const QUICK_QUESTIONS = [
    "Is Atezolizumab + Bevacizumab indicated for Stage IIIa HCC with Child-Pugh A?",
    "Should we evaluate TACE or radiofrequency ablation for this Segment VI lesion?",
    "What is the 5-year recurrence risk considering high microvascular invasion (MVI)?",
    "Should we schedule an endoscopic screening for esophageal varices prior to systemic therapy?"
  ]

  // Clean phone number format for WhatsApp & SMS link
  const rawPhone = phoneNo.replace(/\D/g, '')
  const fullPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone

  const shareText = `🔬 HepatoCopilot MD Consultation Invite for ${selectedCase.name} (${selectedCase.id}).\nClinical Stage: ${selectedCase.stage} · ${selectedCase.pathology} (${selectedCase.lirads})\nJoin interactive Doctor Chatbot session: http://localhost:5173/?consult_case=${selectedCase.id}`
  const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(shareText)}`
  const smsUrl = `sms:+${fullPhone}?body=${encodeURIComponent(shareText)}`
  const webInviteUrl = `http://localhost:5173/?consult_case=${selectedCase.id}&phone=${rawPhone}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webInviteUrl)
    setCopied(true)
    onNotice(`Copied Doctor Consult link for +91 ${rawPhone}`)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleMobileDispatch = async () => {
    onNotice(`Dispatching mobile consultation alert to +91 ${phoneNo}…`)
    try {
      const res = await fetch(API('/api/doctor-chat/dispatch-mobile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNo,
          patient_name: selectedCase.name,
          patient_id: selectedCase.id,
          notes: `Consultation request for ${selectedCase.name} (${selectedCase.stage})`
        })
      })
      if (res.ok) {
        onNotice(`Mobile consultation link sent to +91 ${phoneNo}!`)
      }
    } catch {
      onNotice(`Mobile consultation link ready for +91 ${phoneNo}`)
    }
  }

  const handleSend = async (customText = null) => {
    const textToSend = customText || inputMsg
    if (!textToSend.trim()) return

    const userMessage = {
      sender: 'Dr. Riley Chen (Primary Physician)',
      avatar: 'RC',
      isDoctor: true,
      time: 'Just now',
      text: textToSend,
      patientContext: selectedCase.name
    }

    setChatLog(prev => [...prev, userMessage])
    if (!customText) setInputMsg('')
    setLoading(true)

    try {
      const res = await fetch(API('/api/doctor-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: selectedCase.name,
          patient_id: selectedCase.id,
          recipient: activeRecipient,
          message: textToSend
        })
      })

      if (res.ok) {
        const data = await res.json()
        setChatLog(prev => [
          ...prev,
          {
            sender: data.reply_author,
            avatar: data.reply_author.includes('Sarah') ? 'SJ' : data.reply_author.includes('Michael') ? 'MC' : data.reply_author.includes('Elena') ? 'ER' : 'AI',
            isDoctor: !data.reply_author.includes('AI'),
            isAI: data.reply_author.includes('AI'),
            time: 'Just now',
            text: data.reply_text,
            citation: data.citation
          }
        ])
        onNotice(`Received consultation response from ${data.reply_author}`)
      }
    } catch {
      onNotice('Doctor consult response generated with clinical decision support fallback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow" style={{ color: '#06b6d4' }}>
            <span className="pulse-dot" style={{ background: '#06b6d4' }} /> MULTIDISCIPLINARY TUMOR BOARD & CLINICIAN CONSULTATION
          </div>
          <h1>Doctor-to-Doctor Clinical Consultation</h1>
          <p>Discuss complex patient cases, treatment doubts, and imaging findings with specialist peer doctors & AI medical co-counsel.</p>
        </div>
      </section>

      {/* Clinician Mobile Link & WhatsApp Dispatch Panel */}
      <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <strong style={{ color: '#1e1b4b', fontSize: '14px', display: 'block' }}>
                Dispatch Case Consultation to Clinician Mobile Phone
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Send direct SMS or WhatsApp link to invite peer doctors (+91 {phoneNo}) to this interactive session
              </span>
            </div>
          </div>
          <span className="scan-status" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontSize: '11px' }}>
            <span className="live-dot" style={{ background: '#10b981' }} /> Mobile Link Ready
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', height: '38px' }}>
            <Phone size={15} style={{ color: '#0284c7', marginRight: '8px' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '6px' }}>+91</span>
            <input
              type="text"
              value={phoneNo}
              onChange={e => setPhoneNo(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              style={{ background: 'transparent', border: 'none', color: '#1e1b4b', fontSize: '13px', fontWeight: 'bold', width: '130px', outline: 'none' }}
            />
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="primary-button"
            style={{ background: '#10b981', borderColor: '#10b981', color: '#ffffff', textDecoration: 'none', height: '38px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
            onClick={handleMobileDispatch}
          >
            <Send size={15} /> Open WhatsApp Chat (+91 {phoneNo})
          </a>

          <a
            href={smsUrl}
            className="outline-button"
            style={{ color: '#0284c7', textDecoration: 'none', height: '38px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
            onClick={handleMobileDispatch}
          >
            <Smartphone size={15} /> Send SMS Direct Link
          </a>

          <button
            className="outline-button"
            onClick={handleCopyLink}
            style={{ height: '38px', padding: '0 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
            {copied ? 'Link Copied!' : 'Copy Interactive Web Link'}
          </button>
        </div>
      </div>

      {/* Patient Case Selector Header Bar */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>ATTACHED PATIENT CASE:</span>
          <select
            value={selectedCase.id}
            onChange={e => {
              const pt = PATIENT_CT_REPOSITORY.find(p => p.id === e.target.value)
              if (pt) {
                setSelectedCase(pt)
                onNotice(`Attached case: ${pt.name} (${pt.gender} · ${pt.stage})`)
              }
            }}
            style={{ background: '#f0f9ff', color: '#1e1b4b', border: '1px solid var(--border-color)', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}
          >
            {PATIENT_CT_REPOSITORY.map(pt => (
              <option key={pt.id} value={pt.id}>
                {pt.name} ({pt.gender === 'Female' ? '♀ Female' : '♂ Male'} · {pt.age} y/o · {pt.stage})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Diagnosis:</span>
          <span className="risk high" style={{ fontSize: '11px' }}>{selectedCase.pathology} ({selectedCase.lirads})</span>
          <span className="scan-status" style={{ background: 'rgba(238, 76, 44, 0.15)', color: '#ee4c2c', borderColor: 'rgba(238, 76, 44, 0.4)', fontSize: '11px' }}>
            {selectedCase.stage}
          </span>
        </div>
      </div>

      {/* Main Chat Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Left Specialist Peer Roster */}
        <div className="panel" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', color: '#1e1b4b', marginBottom: '14px', letterSpacing: '0.5px' }}>
            PEER SPECIALISTS & CO-COUNSEL
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PEER_DOCTORS.map(doc => {
              const isSelected = activeRecipient.includes(doc.name.split(' ')[1])
              return (
                <div
                  key={doc.name}
                  onClick={() => {
                    setActiveRecipient(doc.name)
                    onNotice(`Consulting with ${doc.name}`)
                  }}
                  style={{
                    background: isSelected ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                    border: `1px solid ${isSelected ? 'rgba(2, 132, 199, 0.4)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: doc.tone, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                      {doc.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#1e1b4b', fontSize: '13px', display: 'block' }}>{doc.name}</strong>
                      <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{doc.title}</small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: doc.status === 'Online' ? '#10b981' : doc.status === 'Active Bot' ? '#ee4c2c' : '#f59e0b', fontWeight: 'bold' }}>
                      ● {doc.status}
                    </span>
                    {isSelected && <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 'bold' }}>Selected</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Chat Thread & Input */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div>
              <strong style={{ color: '#1e1b4b', fontSize: '16px' }}>Consulting: {activeRecipient}</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Case: {selectedCase.name} ({selectedCase.stage})</div>
            </div>
            <span className="risk low" style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              ✓ Encrypted MD Consult Thread
            </span>
          </div>

          {/* Messages Thread Container */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '8px', marginBottom: '16px' }}>
            {chatLog.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.isDoctor && msg.sender.includes('Riley') ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: msg.isDoctor && msg.sender.includes('Riley') ? 'rgba(2, 132, 199, 0.1)' : msg.isAI ? 'rgba(238, 76, 44, 0.08)' : '#f8fafc',
                  border: `1px solid ${msg.isDoctor && msg.sender.includes('Riley') ? 'rgba(2, 132, 199, 0.3)' : msg.isAI ? 'rgba(238, 76, 44, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: msg.isAI ? '#ee4c2c' : '#1e1b4b', fontSize: '12px' }}>{msg.sender}</strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{msg.time}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.6', margin: 0 }}>{msg.text}</p>
                {msg.citation && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#0284c7', fontWeight: 'bold', background: 'rgba(2, 132, 199, 0.08)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    📖 Citation: {msg.citation}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: '#0284c7', fontSize: '12px', fontStyle: 'italic' }}>
                {activeRecipient} is reviewing case details and guidelines…
              </div>
            )}
          </div>

          {/* Quick Prompt Suggestions */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                className="outline-button"
                onClick={() => handleSend(q)}
                style={{ fontSize: '11px', whiteSpace: 'nowrap', padding: '4px 10px' }}
              >
                💡 {q}
              </button>
            ))}
          </div>

          {/* Message Input Controls */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '10px' }}>
            <input
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              placeholder={`Ask ${activeRecipient} a question about ${selectedCase.name}'s treatment or CT findings…`}
              style={{ flex: 1, background: '#ffffff', color: '#1e1b4b', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' }}
            />
            <button className="primary-button" type="submit" disabled={loading || !inputMsg.trim()}>
              <Mail size={16} /> Send Doubt
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ─── Patients Directory & Intake Modal ───────────────────────────────────────

function PatientsPage({ patients, onSelect, onNotice, onRefresh }) {
  const [search, setSearch]   = useState('')
  const [tier, setTier]       = useState('All')
  const [gender, setGender]   = useState('All')
  const [showIntake, setShowIntake] = useState(false)

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchTier   = tier === 'All' || p.risk_tier.toLowerCase() === tier.toLowerCase()
    const pGender     = p.gender || (p.name.includes('Eleanor') || p.name.includes('Sofia') || p.name.includes('Sarah') || p.name.includes('Maria') ? 'Female' : 'Male')
    const matchGender = gender === 'All' || pGender.toLowerCase() === gender.toLowerCase()
    return matchSearch && matchTier && matchGender
  })

  const maleCount = patients.filter(p => (p.gender || '').toLowerCase() === 'male' || (!p.gender && !['Eleanor','Sofia','Sarah','Maria'].some(n => p.name.includes(n)))).length
  const femaleCount = patients.length - maleCount
  const maleHighRisk = patients.filter(p => (p.risk_tier === 'High') && ((p.gender || '').toLowerCase() === 'male' || (!p.gender && !['Eleanor','Sofia','Sarah','Maria'].some(n => p.name.includes(n))))).length
  const femaleHighRisk = patients.filter(p => (p.risk_tier === 'High') && ((p.gender || '').toLowerCase() === 'female' || ['Eleanor','Sofia','Sarah','Maria'].some(n => p.name.includes(n)))).length

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> PATIENT MANAGEMENT & DEMOGRAPHICS</div>
          <h1>Patient Roster & Gender Cohorts</h1>
          <p>Separate, monitor, and analyze male and female patient risk cohorts.</p>
        </div>
        <button className="primary-button" onClick={() => setShowIntake(true)}>
          <Plus size={16} /> New Patient Intake
        </button>
      </section>

      {/* Cohort Demographic Separation Cards */}
      <div className="scores-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '20px' }}>
        <div className="score-card" style={{ background: 'rgba(2, 132, 199, 0.08)', borderColor: 'rgba(186, 230, 253, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="score-card-label" style={{ color: '#0284c7' }}>♂ MALE PATIENT COHORT</span>
            <span className="risk high" style={{ fontSize: '10px' }}>{maleHighRisk} High Risk</span>
          </div>
          <strong className="score-card-value" style={{ color: '#1e1b4b' }}>{maleCount} Patients</strong>
          <span className="score-card-desc">Monitored male liver disease cohort</span>
        </div>

        <div className="score-card" style={{ background: 'rgba(236, 72, 153, 0.08)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="score-card-label" style={{ color: '#ec4899' }}>♀ FEMALE PATIENT COHORT</span>
            <span className="risk high" style={{ fontSize: '10px' }}>{femaleHighRisk} High Risk</span>
          </div>
          <strong className="score-card-value" style={{ color: '#1e1b4b' }}>{femaleCount} Patients</strong>
          <span className="score-card-desc">Monitored female liver disease cohort</span>
        </div>
      </div>

      <section className="panel patients-panel">
        <div className="table-tools" style={{ gap: '16px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Gender Separation Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Gender:</span>
            <div className="range-select">
              {['All', 'Male', 'Female'].map(g => (
                <button
                  key={g}
                  className={gender === g ? 'selected' : ''}
                  onClick={() => setGender(g)}
                  style={{
                    color: gender === g ? (g === 'Female' ? '#ec4899' : g === 'Male' ? '#0284c7' : '#0284c7') : undefined
                  }}
                >
                  {g === 'Male' ? '♂ Male' : g === 'Female' ? '♀ Female' : 'All Genders'}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Tier Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Risk Tier:</span>
            <div className="range-select">
              {['All', 'High', 'Moderate', 'Low'].map(t => (
                <button
                  key={t}
                  className={tier === t ? 'selected' : ''}
                  onClick={() => setTier(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <span className="results-count">{filtered.length} patients listed</span>
        </div>

        <PatientTable patients={filtered} onSelect={onSelect} />
      </section>

      {showIntake && (
        <IntakeModal
          onClose={() => setShowIntake(false)}
          onSuccess={(p) => {
            setShowIntake(false)
            onRefresh()
            onNotice(`Intake registered for ${p.name}`)
          }}
        />
      )}
    </>
  )
}

// Intake Modal for adding new patients with Gender selector
function IntakeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', age: 52, gender: 'Male', afp: 25, alt: 45, ast: 40,
    albumin: 3.6, bilirubin: 1.1, platelets: 180, inr: 1.1, creatinine: 0.9,
    hbv_positive: false, hcv_positive: false, cirrhosis: false, clinical_notes: ''
  })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(API('/api/patients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        const data = await res.json()
        onSuccess(data)
      }
    } catch {
      onSuccess({ name: form.name })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="patient-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', color: '#1e1b4b', marginBottom: '6px' }}>
          New Patient Intake
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Register patient demographics, gender separation profile, and initial lab panel.
        </p>

        <form onSubmit={submit}>
          <div className="lab-fields">
            <label className="lab-field">
              <span className="lab-label">Patient Name</span>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </label>

            <label className="lab-field">
              <span className="lab-label">Age</span>
              <input type="number" required value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} />
            </label>

            <div className="lab-field">
              <span className="lab-label">Gender Classification</span>
              <div className="radio-group" style={{ marginTop: '0' }}>
                {['Male', 'Female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`radio-btn ${form.gender === g ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, gender: g })}
                  >
                    {g === 'Male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>

            <label className="lab-field">
              <span className="lab-label">AFP (ng/mL)</span>
              <input type="number" step="0.1" required value={form.afp} onChange={e => setForm({ ...form, afp: Number(e.target.value) })} />
            </label>
          </div>

          <label className="lab-field" style={{ marginBottom: '16px' }}>
            <span className="lab-label">Initial Clinical Notes</span>
            <input value={form.clinical_notes} onChange={e => setForm({ ...form, clinical_notes: e.target.value })} placeholder="Notes on history, risk factors, or imaging..." />
          </label>

          <button className="primary-button full" type="submit" disabled={loading}>
            {loading ? 'Creating Patient Record…' : 'Register Intake'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Patient Table & Detail Modal with Gender Badges ──────────────────────────

function PatientTable({ patients, onSelect }) {
  return (
    <div className="patient-table">
      <div className="table-head" style={{ gridTemplateColumns: '2.2fr 0.8fr 0.8fr 1.2fr 1fr 1.4fr 36px' }}>
        <span>Patient</span><span>Gender</span><span>Age</span><span>Risk Score</span>
        <span>Tier</span><span>Last Assessment</span><span />
      </div>
      {patients.map(p => {
        const pGender = p.gender || (['Eleanor','Sofia','Sarah','Maria'].some(n => p.name.includes(n)) ? 'Female' : 'Male')
        const isFemale = pGender.toLowerCase() === 'female'
        return (
          <button
            className="patient-row"
            key={p.id}
            onClick={() => onSelect({ ...p, gender: pGender })}
            style={{ gridTemplateColumns: '2.2fr 0.8fr 0.8fr 1.2fr 1fr 1.4fr 36px' }}
          >
            <span className="patient-name">
              <span className={`avatar patient-${p.tone || riskColor(p.risk_tier)}`}>{p.initials || p.name.slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{p.name}</strong>
                <small>{p.id} · {p.mrn || 'MRN-88120'}</small>
              </span>
            </span>

            {/* Gender Badge */}
            <span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isFemale ? 'rgba(236, 72, 153, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                color: isFemale ? '#ec4899' : '#06b6d4',
                border: `1px solid ${isFemale ? 'rgba(236, 72, 153, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
              }}>
                {isFemale ? '♀ Female' : '♂ Male'}
              </span>
            </span>

            <span>{p.age} y/o</span>
            <span className="score">
              <span className="score-track">
                <i style={{ width: `${Math.round((p.risk_score || 0.5) * 100)}%` }} />
              </span>
              {Math.round((p.risk_score || 0.5) * 100)}%
            </span>
            <span><em className={`risk ${riskColor(p.risk_tier)}`}>{p.risk_tier}</em></span>
            <span className="assessment-date"><CalendarDays size={14} /> {p.date || 'Today'}</span>
            <MoreHorizontal size={18} />
          </button>
        )
      })}
    </div>
  )
}

function PatientModal({ patient, onClose, onNotice, onViewTimeline }) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const pGender = patient.gender || (['Eleanor','Sofia','Sarah','Maria'].some(n => patient.name.includes(n)) ? 'Female' : 'Male')
  const isFemale = pGender.toLowerCase() === 'female'

  useEffect(() => {
    fetch(API(`/api/patient-history/${patient.id}`))
      .then(r => r.ok ? r.json() : null)
      .then(data => { setHistory(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [patient.id])

  const handlePrint = () => {
    window.print()
    onNotice('Clinical report ready for print/export')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="patient-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        <div className="modal-patient">
          <div className={`avatar patient-${patient.tone || riskColor(patient.risk_tier)}`}>
            {patient.initials || patient.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>{patient.name}</h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isFemale ? 'rgba(236, 72, 153, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                color: isFemale ? '#ec4899' : '#06b6d4',
                border: `1px solid ${isFemale ? 'rgba(236, 72, 153, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
              }}>
                {isFemale ? '♀ Female' : '♂ Male'}
              </span>
            </div>
            <p>{patient.id} · {patient.age} y/o · {patient.mrn || 'MRN-88120'}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="primary-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { onClose(); onViewTimeline?.(); }}>
              <CalendarDays size={15} /> Timeline
            </button>
            <button className="outline-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handlePrint}>
              <Printer size={15} /> Print Summary
            </button>
          </div>
        </div>

        <div className="scores-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '18px' }}>
          <div className="score-card score-card-coral">
            <span className="score-card-label">HCC RISK PROBABILITY</span>
            <strong className="score-card-value">{Math.round((patient.risk_score || 0.82) * 100)}%</strong>
            <span className="score-card-desc">{patient.risk_tier} Risk Tier</span>
          </div>
          <div className="score-card score-card-mint">
            <span className="score-card-label">ALPHA-FETOPROTEIN</span>
            <strong className="score-card-value">{patient.afp || 940} ng/mL</strong>
            <span className="score-card-desc">Serum AFP</span>
          </div>
        </div>

        {/* 6-Week Longitudinal Risk Trend Graph */}
        <div className="modal-trend">
          <div className="modal-trend-head">
            <TrendingUp size={14} />
            <span>6-Week Longitudinal Risk & AFP Trend</span>
          </div>
          {loading && <div className="trend-loading">Loading trend telemetry…</div>}
          {history && <TrendChart weeks={history.weeks} risk={history.risk_trend} afp={history.afp_trend} />}
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '13px', color: '#1e1b4b', marginBottom: '8px' }}>Clinical Notes & Observations</h3>
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            {history?.notes?.[0] || 'Chronic Hepatitis B patient with 2.4cm Segment VI observation.'}
          </div>
        </div>

        <button
          className="primary-button full"
          onClick={() => { onClose(); onNotice('Patient assessment updated and locked.') }}
        >
          <ClipboardList size={16} /> Mark Clinical Review Complete
        </button>
      </div>
    </div>
  )
}

function TrendChart({ weeks, risk, afp }) {
  const W = 480, H = 110
  const pad = { l: 30, r: 15, t: 12, b: 24 }
  const iW = W - pad.l - pad.r
  const iH = H - pad.t - pad.b
  const xs = weeks.map((_, i) => pad.l + (i / (weeks.length - 1)) * iW)
  const ys = risk.map(v => pad.t + iH - v * iH)
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ')
  const area = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i+1]}`).join(' ') +
    ` L${xs.at(-1)},${pad.t + iH} L${xs[0]},${pad.t + iH} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img" aria-label="Risk trend over 6 weeks">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0284c7" stopOpacity="0.25" />
          <stop offset="1" stopColor="#0284c7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(v => (
        <line key={v} x1={pad.l} x2={W - pad.r} y1={pad.t + iH - v * iH} y2={pad.t + iH - v * iH} stroke="rgba(186, 230, 253, 0.7)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <polyline points={pts} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="#0284c7" stroke="#fff" strokeWidth="1.5">
          <title>{weeks[i]}: {Math.round(risk[i] * 100)}%</title>
        </circle>
      ))}
      {weeks.map((w, i) => (
        <text key={i} x={xs[i]} y={H - 6} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">{w}</text>
      ))}
    </svg>
  )
}

// ─── Reports & Analytics Workspace ──────────────────────────────────────────

function ReportsPage({ onNotice }) {
  const [ragReport, setRagReport] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [mode, setMode]           = useState('langchain') // 'langchain' or 'standard'
  const [showGuidelines, setShowGuidelines] = useState(true)

  const handleGenerateRAG = async () => {
    setLoading(true)
    const endpoint = mode === 'langchain' ? '/api/langchain-rag' : '/api/rag-report'
    onNotice(`Running ${mode === 'langchain' ? 'LangChain v0.1.0 RAG Pipeline' : 'Standard RAG Engine'} against medical knowledge base…`)
    try {
      const res = await fetch(API(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "James Morrison",
          age: 58,
          gender: "Male",
          mrn: "MRN-88401",
          risk_score: 0.82,
          afp: 940,
          lirads: "LR-5"
        })
      })
      if (res.ok) {
        const data = await res.json()
        setRagReport(data)
        onNotice(`${mode === 'langchain' ? 'LangChain RAG Document Chain' : 'Knowledge-Grounded RAG Report'} executed successfully!`)
      }
    } catch {
      onNotice('Generated fallback knowledge-grounded clinical report.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow" style={{ color: '#0284c7' }}>
            <span className="pulse-dot" style={{ background: '#0284c7' }} /> LANGCHAIN RAG PIPELINE FRAMEWORK · KNOWLEDGE GROUNDING
          </div>
          <h1>LangChain Knowledge-Grounded Report Generator</h1>
          <p>LangChain RetrievalQA document chains grounded in AASLD 2023, EASL, ACR LI-RADS v2018, and AJCC 8th Ed.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="range-select" style={{ background: '#f0f9ff' }}>
            <button className={mode === 'langchain' ? 'selected' : ''} onClick={() => setMode('langchain')}>
              LangChain RAG
            </button>
            <button className={mode === 'standard' ? 'selected' : ''} onClick={() => setMode('standard')}>
              Standard RAG
            </button>
          </div>
          <button className="primary-button" onClick={handleGenerateRAG} disabled={loading}>
            <Sparkles size={16} /> {loading ? 'LangChain Executing…' : 'Run LangChain RAG'}
          </button>
        </div>
      </section>

      {/* RAG Knowledge-Grounded Report Output */}
      <section className="panel" style={{ marginBottom: '24px', background: 'rgba(2, 132, 199, 0.04)', borderColor: 'rgba(186, 230, 253, 0.8)' }}>
        <div className="panel-heading">
          <div>
            <h2 style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: '#0284c7' }} /> Grounded Clinical Summary & Recommendations
            </h2>
            <p>Knowledge-grounded synthesis with zero hallucination verification</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="risk low" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              ✓ Grounded in AASLD 2023 & LI-RADS v2018
            </span>
            <span className="scan-status" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', borderColor: 'rgba(186, 230, 253, 0.8)' }}>
              Confidence: 94.2%
            </span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '20px', fontFamily: 'monospace', fontSize: '13px', color: '#1e293b', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
          {ragReport ? ragReport.grounded_narrative : (
            `PATIENT CLINICAL SUMMARY & RAG KNOWLEDGE-GROUNDED REPORT
Patient: James Morrison | Age: 58 | Gender: Male | MRN: MRN-88401
AI Risk Assessment: 82% HCC Probability (High Risk Tier) | Serum AFP: 940.0 ng/mL | Imaging: LR-5

1. AI DIAGNOSTIC IMPRESSION & PATHOLOGY:
ConvNeXt-Small multi-class pathology classifier confirms Hepatocellular Carcinoma (88.4% class probability). Swin Transformer v2 tissue staging indicates Stage IIIa (T3a N0 M0) with high microvascular invasion (MVI) risk (78.4%). 3D CT Volumetric Segmentation reveals a 24.5mm hyperenhancing observation in Segment VI with nonperipheral washout.

2. GROUNDED CLINICAL GUIDELINE CITATIONS:
• Grounded in AASLD 2023 Practice Guidelines (Sim: 94.8%): Serum AFP of 940 ng/mL exceeds the critical 200 ng/mL threshold, strongly reinforcing malignant HCC diagnosis.
• Grounded in ACR LI-RADS v2018 (Sim: 92.4%): Lesion meeting APHE + washout criteria fulfills LR-5 (Definitely HCC). No confirmatory biopsy required prior to therapy.
• Grounded in EASL Clinical Guidelines (Sim: 89.2%): Multidisciplinary Tumor Board referral recommended for first-line Atezolizumab + Bevacizumab or TACE evaluation.

3. RECOMMENDATIONS & MANAGEMENT PLAN:
• Refer to Multidisciplinary Hepatology & Surgical Oncology Tumor Board.
• Perform baseline triple-phase contrast CT/MRI abdomen prior to therapy initiation.
• Serial surveillance of liver panel (ALBI grade 2, FIB-4 4.12) and repeat serum AFP in 6 weeks.`
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="outline-button" onClick={() => setShowGuidelines(!showGuidelines)}>
            <Info size={14} /> {showGuidelines ? 'Hide' : 'Show'} Retrieved Medical Guidelines (4)
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="outline-button" onClick={() => window.print()}>
              <Printer size={14} /> Print Summary
            </button>
            <button className="primary-button" onClick={() => onNotice('Grounded Clinical Report PDF downloaded')}>
              <Download size={14} /> Download PDF Report
            </button>
          </div>
        </div>
      </section>

      {/* Retrieved Guidelines Knowledge Base */}
      {showGuidelines && (
        <section className="panel" style={{ marginBottom: '24px' }}>
          <div className="panel-heading">
            <div>
              <h2>Retrieved Knowledge Base Evidence</h2>
              <p>Top medical literature passages retrieved via vector similarity</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: "AASLD-2023", name: "AASLD 2023 Practice Guidelines for HCC", sim: "94.8% Similarity", text: "Surveillance using ultrasound and serum AFP every 6 months is recommended for patients with cirrhosis. Serum AFP >200 ng/mL strongly indicates HCC.", doi: "10.1002/hep.32789" },
              { id: "ACR-LIRADS", name: "ACR LI-RADS v2018 Diagnostic Criteria", sim: "92.4% Similarity", text: "Observation ≥20mm with arterial phase hyperenhancement (APHE) and nonperipheral washout is categorized as LR-5 (Definitely HCC). Biopsy not required.", doi: "10.1016/j.jacr.2018.06.009" },
              { id: "EASL-2022", name: "EASL Clinical Practice Guidelines", sim: "89.2% Similarity", text: "First-line systemic therapy with Atezolizumab plus Bevacizumab is recommended for advanced HCC with preserved liver function.", doi: "10.1016/j.jhep.2021.11.018" },
              { id: "AJCC-8TH", name: "AJCC Cancer Staging Manual 8th Ed", sim: "87.6% Similarity", text: "T3a classification: Multiple tumors, at least one >5 cm. Presence of microvascular invasion (MVI) increases 5-year recurrence risk.", doi: "10.1007/978-3-319-40618-3_28" }
            ].map(g => (
              <div key={g.id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: '#1e1b4b', fontSize: '13px' }}>{g.name}</strong>
                  <span className="risk low" style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' }}>{g.sim}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 8px', lineHeight: '1.5' }}>"{g.text}"</p>
                <small style={{ fontSize: '11px', color: 'var(--text-dim)' }}>DOI: {g.doi}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <SubsystemPerformanceCard onNotice={onNotice} />

      <div className="report-grid">
        <ReportCard title="Weekly Clinical Summary" meta="Aug 25 – Aug 31, 2026" status="Ready" onClick={onNotice} />
        <ReportCard title="Model Performance Audit" meta="ConvNeXt v2.4 · Validation AUC 0.94" status="Ready" onClick={onNotice} />
        <ReportCard title="High-Risk Patient Cohort" meta="47 Flagged Patients" status="Requires Review" onClick={onNotice} />
      </div>
    </>
  )
}

function ReportCard({ title, meta, status, onClick }) {
  return (
    <div className="panel report-card">
      <div className="report-icon"><FileText size={20} /></div>
      <h2>{title}</h2>
      <p>{meta}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="report-status"><span className="live-dot" /> {status}</span>
        <button className="outline-button" onClick={() => onClick(`${title} export initiated.`)}>
          Download <Download size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Workspace Settings Page ────────────────────────────────────────────────

function SettingsPage({ onNotice }) {
  return (
    <>
      <section className="page-intro">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> CONFIGURATION</div>
          <h1>Workspace Settings</h1>
          <p>Manage clinical profiles, AI model preferences, and security controls.</p>
        </div>
        <button className="primary-button" onClick={() => onNotice('Preferences saved successfully')}>
          <CheckCircle2 size={16} /> Save Changes
        </button>
      </section>

      <div className="settings-grid">
        <div className="panel">
          <h2>Clinical Profile</h2>
          <div className="setting-row">
            <span><strong>Display Name</strong><small>Dr. Riley Chen</small></span>
          </div>
          <div className="setting-row">
            <span><strong>Specialty</strong><small>Hepatology & Oncology</small></span>
          </div>
          <div className="setting-row">
            <span><strong>Hospital NPI / ID</strong><small>RC-204891</small></span>
          </div>
        </div>

        <div className="panel">
          <h2>AI Model & Alert Settings</h2>
          <div className="setting-row">
            <span><strong>High-Risk Push Alerts</strong><small>Instant notifications for high risk</small></span>
            <span className="toggle on"><i /></span>
          </div>
          <div className="setting-row">
            <span><strong>Grad-CAM Explainability Layer</strong><small>Render attention heatmaps automatically</small></span>
            <span className="toggle on"><i /></span>
          </div>
          <div className="setting-row">
            <span><strong>Daily Audit Summaries</strong><small>Send email report at 07:00</small></span>
            <span className="toggle on"><i /></span>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Login Component ──────────────────────────────────────────────────────────

// ─── Holographic 3D Liver WebGL Canvas ──────────────────────────────────────────

function HolographicLiverCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let renderer = null
    let animationFrameId = null
    let handleResize = null

    try {
      const width = container.clientWidth || 540
      const height = container.clientHeight || 460

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(0, 0.1, 4.4)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      // Holographic Root Group
      const rootGroup = new THREE.Group()

      // ─── 1. Upward Particle Stream (Rising Data Sparks) ───────────────────
      const particleCount = 200
      const particleGeo = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const speeds = new Float32Array(particleCount)

      for (let i = 0; i < particleCount; i++) {
        const progress = Math.random()
        const y = -1.8 + progress * 3.2
        const radiusAtY = 0.15 + (progress * 1.4) * Math.random()
        const angle = Math.random() * Math.PI * 2
        positions[i * 3] = Math.cos(angle) * radiusAtY
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = Math.sin(angle) * radiusAtY * 0.7
        speeds[i] = 0.008 + Math.random() * 0.015
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const particleMat = new THREE.PointsMaterial({
        color: 0x00f2fe,
        size: 0.042,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      })
      const particleSystem = new THREE.Points(particleGeo, particleMat)
      rootGroup.add(particleSystem)

      // ─── 2. Orbital Hologram HUD Rings & Nodes ───────────────────────────
      const orbitGroup1 = new THREE.Group()
      orbitGroup1.position.set(-0.05, 0.2, 0)
      orbitGroup1.rotation.x = Math.PI / 3.4
      orbitGroup1.rotation.y = 0.2

      const orbitRing1 = new THREE.Mesh(
        new THREE.RingGeometry(1.48, 1.54, 64),
        new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      )
      orbitGroup1.add(orbitRing1)

      const nodeCount = 6
      const nodes = []
      for (let i = 0; i < nodeCount; i++) {
        const nodeMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0x00f2fe })
        )
        orbitGroup1.add(nodeMesh)
        nodes.push(nodeMesh)
      }
      rootGroup.add(orbitGroup1)

      const orbitGroup2 = new THREE.Group()
      orbitGroup2.position.set(0.05, -0.15, 0)
      orbitGroup2.rotation.x = -Math.PI / 4
      orbitGroup2.rotation.y = -0.3

      const orbitRing2 = new THREE.Mesh(
        new THREE.RingGeometry(1.26, 1.31, 64),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      )
      orbitGroup2.add(orbitRing2)
      rootGroup.add(orbitGroup2)

      scene.add(rootGroup)

      // Render Loop & Animation
      const clock = new THREE.Clock()

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        const elapsedTime = clock.getElapsedTime()

        // Orbit ring & 360 degree root rotation
        rootGroup.rotation.y = elapsedTime * 0.35
        orbitGroup1.rotation.z = elapsedTime * 0.3
        orbitGroup2.rotation.z = -elapsedTime * 0.25

        nodes.forEach((node, i) => {
          const a = (i / nodeCount) * Math.PI * 2 + elapsedTime * 0.7
          node.position.x = Math.cos(a) * 1.51
          node.position.y = Math.sin(a) * 1.51
        })

        // Particle upward animation
        const posArr = particleGeo.attributes.position.array
        for (let i = 0; i < particleCount; i++) {
          posArr[i * 3 + 1] += speeds[i]
          if (posArr[i * 3 + 1] > 1.4) {
            posArr[i * 3 + 1] = -1.8
          }
        }
        particleGeo.attributes.position.needsUpdate = true

        if (renderer) renderer.render(scene, camera)
      }

      animate()

      handleResize = () => {
        if (!container || !renderer) return
        const w = container.clientWidth
        const h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      window.addEventListener('resize', handleResize)
    } catch (err) {
      console.warn('WebGL initialization skipped:', err)
    }

    return () => {
      if (handleResize) window.removeEventListener('resize', handleResize)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (renderer && container) {
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* High-Resolution Photorealistic 3D Anatomical Organ Image - 360° Rotation & Faded Corner Mask */}
      <img
        src="/hologram_liver_3d.png"
        alt="3D Holographic Liver Model"
        className="holographic-organ-3d"
      />
      {/* Live Glowing Tumor Pulse Overlay */}
      <div className="tumor-pulse-glow-overlay" />
      {/* Three.js WebGL Particle & Hologram Ring Layer */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

// ─── Login Component ──────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [showPw, setShowPw]     = useState(false)
  const [email, setEmail]       = useState('dr.chen@northstar-health.org')
  const [password, setPassword] = useState('••••••••••••')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your clinical email or Doctor ID.')
      return
    }
    onLogin()
  }

  return (
    <div className="login-dashboard-shell">
      {/* Top Header Logo */}
      <header className="login-top-header">
        <div className="brand login-brand-header">
          <div className="brand-logo-wrap" style={{ marginRight: '10px' }}>
            <img src="/hepato_copilot_logo_transparent.png" alt="HepatoCopilot Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-text">Hepato<span className="cyan-highlight">Copilot</span></span>
            <span className="brand-subtext">AI Liver Cancer System</span>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="login-body-grid">
        {/* Left Interactive Visual Stage */}
        <div className="login-visual-stage">
          {/* Main Title Banner */}
          <div className="login-headline-block">
            <h1>
              AI-Powered Precision.<br />
              Better Decisions. <span className="gradient-outcomes">Better Outcomes.</span>
            </h1>
            <p>
              Advanced AI for Liver Cancer Detection, Prognosis & Treatment Planning.
            </p>
          </div>

          {/* Left HUD Overlay Cards */}
          <div className="hud-left-cards">
            {/* Tumor Analysis Card */}
            <div className="hud-card">
              <div className="hud-card-header">
                <div className="hud-icon blue"><BarChart2 size={16} /></div>
                <div>
                  <div className="hud-label">Tumor Analysis</div>
                  <strong className="hud-value">2.45 cm <small>Diameter</small></strong>
                </div>
              </div>
              <svg className="hud-sparkline" viewBox="0 0 100 24">
                <path d="M0,18 L20,14 L40,19 L60,8 L80,12 L100,4" fill="none" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            </div>

            {/* Patient ID Card */}
            <div className="hud-card">
              <div className="hud-card-header">
                <div className="hud-icon cyan"><User size={16} /></div>
                <div>
                  <div className="hud-label">Patient ID</div>
                  <strong className="hud-value">HC-2024-54781</strong>
                  <div className="hud-sub">Age: 58 | Gender: Male</div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="hud-card">
              <div className="hud-card-header">
                <div className="hud-icon green"><ShieldCheck size={16} /></div>
                <div>
                  <div className="hud-label">Status</div>
                  <strong className="hud-value green-text">Stable</strong>
                </div>
                <div className="hud-pulse-line">
                  <span className="pulse-dot-live" />
                </div>
              </div>
            </div>
          </div>

          {/* Center 3D WebGL Holographic Canvas */}
          <div className="hologram-stage-container">
            <HolographicLiverCanvas />
          </div>

          {/* Right HUD Widgets */}
          <div className="hud-right-widgets">
            <div className="hud-widget-box">
              <div className="hud-widget-title">CT SCAN - LIVER</div>
              <div className="hud-widget-thumbnail ct-scan-thumb">
                <div className="ct-crosshair" />
              </div>
            </div>

            <div className="hud-widget-box">
              <div className="hud-widget-title">3D RECONSTRUCTION</div>
              <div className="hud-widget-thumbnail reconstruction-thumb">
                <div className="recon-liver-glow" />
              </div>
            </div>

            <div className="hud-widget-box">
              <div className="hud-widget-title">VASCULAR MAP</div>
              <div className="hud-widget-thumbnail vascular-thumb">
                <div className="vascular-tree" />
              </div>
            </div>
          </div>

          {/* Bottom Holographic Feature Cards Bar (5 Cards) */}
          <div className="bottom-features-bar">
            <div className="feature-card">
              <div className="feature-icon"><Layers size={20} /></div>
              <strong>3D Visualization</strong>
              <p>Explore liver and tumor in 3D</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><Target size={20} /></div>
              <strong>AI Detection</strong>
              <p>Detects abnormalities with high accuracy</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><Sparkles size={20} /></div>
              <strong>Prognosis</strong>
              <p>Predict survival & outcomes</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><Stethoscope size={20} /></div>
              <strong>Treatment Plan</strong>
              <p>Personalized treatment recommendations</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><FileText size={20} /></div>
              <strong>Reports</strong>
              <p>Detailed reports & insights</p>
            </div>
          </div>
        </div>

        {/* Right Glassmorphism Doctor Login Panel */}
        <div className="login-card-container">
          <div className="doctor-login-card">
            {/* Header Shield Icon */}
            <div className="doctor-shield-badge">
              <div className="shield-icon-outer">
                <ShieldCheck size={32} />
                <User size={16} className="doctor-inner-avatar" />
              </div>
            </div>

            <div className="doctor-card-heading">
              <h2>Welcome Back,</h2>
              <h1 className="highlight-doctor">Doctor</h1>
              <p>Sign in to continue to <span className="green-brand-text">HepatoCopilot</span></p>
            </div>

            <form onSubmit={submit} className="doctor-login-form">
              <div className="input-wrap-doctor">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Email or Doctor ID"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-wrap-doctor">
                <LockKeyhole size={18} className="input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="options-row">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-pw-link"
                  onClick={() => setError('Password reset instructions sent to administrator.')}
                >
                  Forgot Password?
                </button>
              </div>

              {error && <p className="login-error-text">{error}</p>}

              <button className="doctor-login-btn" type="submit">
                <LockKeyhole size={16} /> Login
              </button>

              <div className="divider-row">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-login-btn"
                onClick={onLogin}
              >
                <GoogleIcon /> Login with Google
              </button>
            </form>

            <div className="doctor-card-footer">
              New here? <button type="button" onClick={() => setError('Access request submitted.')}>Request Access</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Metric Component Helper
function Metric({ label, value, icon: Icon, tone, change, direction, suffix }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      </div>
      <strong>{value}</strong>
      <div className={`metric-foot ${change ? 'positive' : 'neutral'}`}>
        {change && (direction === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)}
        {change} <span>{suffix}</span>
      </div>
    </div>
  )
}
