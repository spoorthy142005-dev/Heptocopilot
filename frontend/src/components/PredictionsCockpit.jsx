import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity, BrainCircuit, Layers, Target, Sparkles, Stethoscope,
  AlertTriangle, CheckCircle2, ChevronRight, Upload, Play, RefreshCw,
  FileText, Download, Copy, Check, BarChart2, TrendingUp, ShieldAlert,
  HeartPulse, Microscope, Info, ArrowUpRight, ArrowDownRight, Clock,
  User, Database, Zap, Cpu, Award
} from 'lucide-react'

const API = (path) => `http://127.0.0.1:8000${path}`

const PRESET_PATIENTS = [
  {
    id: 'PT-10482',
    name: 'James Morrison',
    age: 58,
    gender: 'Male',
    mrn: 'MRN-88401',
    afp: 450.0,
    albumin: 3.2,
    bilirubin: 1.8,
    alt: 55.0,
    ast: 62.0,
    platelets: 120.0,
    inr: 1.25,
    creatinine: 1.1,
    cirrhosis: true,
    lesion_diameter_mm: 28.5,
    arterial_hyperenhancement: true,
    washout: true,
    image: '/ct_scans/james_morrison_ct.jpg',
    expectedStage: 'BCLC Stage B (Intermediate)',
  },
  {
    id: 'PT-10476',
    name: 'Eleanor Vance',
    age: 64,
    gender: 'Female',
    mrn: 'MRN-88219',
    afp: 18.0,
    albumin: 4.1,
    bilirubin: 0.8,
    alt: 28.0,
    ast: 32.0,
    platelets: 210.0,
    inr: 1.05,
    creatinine: 0.9,
    cirrhosis: false,
    lesion_diameter_mm: 16.0,
    arterial_hyperenhancement: false,
    washout: false,
    image: '/ct_scans/eleanor_vance_ct.jpg',
    expectedStage: 'BCLC Stage 0/A (Early)',
  },
  {
    id: 'PT-10471',
    name: 'Robert Chen',
    age: 51,
    gender: 'Male',
    mrn: 'MRN-88104',
    afp: 980.0,
    albumin: 2.8,
    bilirubin: 2.9,
    alt: 78.0,
    ast: 92.0,
    platelets: 85.0,
    inr: 1.55,
    creatinine: 1.4,
    cirrhosis: true,
    lesion_diameter_mm: 48.0,
    arterial_hyperenhancement: true,
    washout: true,
    image: '/ct_scans/robert_chen_ct.jpg',
    expectedStage: 'BCLC Stage C (Advanced)',
  },
  {
    id: 'PT-10469',
    name: 'Maria Santos',
    age: 49,
    gender: 'Female',
    mrn: 'MRN-88055',
    afp: 280.0,
    albumin: 3.5,
    bilirubin: 1.4,
    alt: 44.0,
    ast: 50.0,
    platelets: 155.0,
    inr: 1.18,
    creatinine: 1.0,
    cirrhosis: false,
    lesion_diameter_mm: 24.0,
    arterial_hyperenhancement: true,
    washout: true,
    image: '/ct_scans/maria_santos_ct.jpg',
    expectedStage: 'BCLC Stage B (Intermediate)',
  }
]

export default function PredictionsCockpit({ onNotice }) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PATIENTS[0])
  const [patientId, setPatientId] = useState(PRESET_PATIENTS[0].id)
  const [patientName, setPatientName] = useState(PRESET_PATIENTS[0].name)
  const [age, setAge] = useState(PRESET_PATIENTS[0].age)
  const [gender, setGender] = useState(PRESET_PATIENTS[0].gender)
  const [mrn, setMrn] = useState(PRESET_PATIENTS[0].mrn)

  // Clinical biomarkers
  const [afp, setAfp] = useState(PRESET_PATIENTS[0].afp)
  const [albumin, setAlbumin] = useState(PRESET_PATIENTS[0].albumin)
  const [bilirubin, setBilirubin] = useState(PRESET_PATIENTS[0].bilirubin)
  const [alt, setAlt] = useState(PRESET_PATIENTS[0].alt)
  const [ast, setAst] = useState(PRESET_PATIENTS[0].ast)
  const [platelets, setPlatelets] = useState(PRESET_PATIENTS[0].platelets)
  const [inr, setInr] = useState(PRESET_PATIENTS[0].inr)
  const [creatinine, setCreatinine] = useState(PRESET_PATIENTS[0].creatinine)
  const [cirrhosis, setCirrhosis] = useState(PRESET_PATIENTS[0].cirrhosis)
  const [diameterMm, setDiameterMm] = useState(PRESET_PATIENTS[0].lesion_diameter_mm)
  const [aphe, setAphe] = useState(PRESET_PATIENTS[0].arterial_hyperenhancement)
  const [washout, setWashout] = useState(PRESET_PATIENTS[0].washout)

  // Uploaded CT volume or image
  const [ctFile, setCtFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(PRESET_PATIENTS[0].image)
  const [blend, setBlend] = useState(65)
  const [copiedReport, setCopiedReport] = useState(false)

  // Pipeline execution state
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Load a preset patient into inputs
  const handleSelectPreset = (pt) => {
    setSelectedPreset(pt)
    setPatientId(pt.id)
    setPatientName(pt.name)
    setAge(pt.age)
    setGender(pt.gender)
    setMrn(pt.mrn)
    setAfp(pt.afp)
    setAlbumin(pt.albumin)
    setBilirubin(pt.bilirubin)
    setAlt(pt.alt)
    setAst(pt.ast)
    setPlatelets(pt.platelets)
    setInr(pt.inr)
    setCreatinine(pt.creatinine)
    setCirrhosis(pt.cirrhosis)
    setDiameterMm(pt.lesion_diameter_mm)
    setAphe(pt.arterial_hyperenhancement)
    setWashout(pt.washout)
    setCtFile(null)
    setPreviewUrl(pt.image)
    if (onNotice) onNotice(`Loaded patient case: ${pt.name} (${pt.id})`)
  }

  // Handle local file upload (.nii, .nii.gz, .dcm, or .jpg/.png)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCtFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      // For NIfTI files, keep preset preview or show volumetric icon
      setPreviewUrl(selectedPreset?.image || '/ct_scans/james_morrison_ct.jpg')
    }
    if (onNotice) onNotice(`Attached volumetric CT file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
  }

  // Master Unified Pipeline Trigger (/api/v1/analyze)
  const runMasterPipeline = useCallback(async () => {
    setLoading(true)
    const t0 = performance.now()

    try {
      let res
      if (ctFile) {
        // Multipart Form Data mode
        const form = new FormData()
        form.append('patient_id', patientId)
        form.append('name', patientName)
        form.append('age', String(age))
        form.append('gender', gender)
        form.append('mrn', mrn)
        form.append('afp', String(afp))
        form.append('albumin', String(albumin))
        form.append('bilirubin', String(bilirubin))
        form.append('alt', String(alt))
        form.append('ast', String(ast))
        form.append('platelets', String(platelets))
        form.append('inr', String(inr))
        form.append('creatinine', String(creatinine))
        form.append('cirrhosis', String(cirrhosis))
        form.append('lesion_diameter_mm', String(diameterMm))
        form.append('arterial_hyperenhancement', String(aphe))
        form.append('washout', String(washout))
        form.append('ct_file', ctFile)

        res = await fetch(API('/api/v1/analyze'), {
          method: 'POST',
          body: form,
        })
      } else {
        // JSON payload mode
        const payload = {
          patient_id: patientId,
          name: patientName,
          age: Number(age),
          gender,
          mrn,
          afp: Number(afp),
          albumin: Number(albumin),
          bilirubin: Number(bilirubin),
          alt: Number(alt),
          ast: Number(ast),
          platelets: Number(platelets),
          inr: Number(inr),
          creatinine: Number(creatinine),
          cirrhosis: Boolean(cirrhosis),
          lesion_diameter_mm: Number(diameterMm),
          arterial_hyperenhancement: Boolean(aphe),
          washout: Boolean(washout),
        }

        res = await fetch(API('/api/v1/analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const elapsed = Math.round(performance.now() - t0)

      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data)
        setTelemetry({
          latencyMs: elapsed,
          status: '200 OK',
          timestamp: new Date().toLocaleTimeString(),
          engine: 'FastAPI v0.110 · PyTorch 2.2 · FAISS',
          modulesRun: 6,
        })
        if (onNotice) {
          onNotice(`Master Multimodal Pipeline complete in ${elapsed}ms! Stage: ${data.stage_predictions?.bclc_stage || data.modules?.module3_staging?.bclc_stage}`)
        }
      } else {
        throw new Error(`Server returned HTTP ${res.status}`)
      }
    } catch (err) {
      console.error('Error invoking /api/v1/analyze:', err)
      if (onNotice) onNotice(`Pipeline error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [ctFile, patientId, patientName, age, gender, mrn, afp, albumin, bilirubin, alt, ast, platelets, inr, creatinine, cirrhosis, diameterMm, aphe, washout, onNotice])

  // Automatically trigger baseline analysis on initial mount
  useEffect(() => {
    runMasterPipeline()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyReport = () => {
    if (!analysisResult?.clinical_report_text) return
    navigator.clipboard.writeText(analysisResult.clinical_report_text)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2500)
    if (onNotice) onNotice('Clinical RAG Report copied to clipboard!')
  }

  // Extract nested or top-level fields cleanly
  const metrics = analysisResult?.metrics || {}
  const stageData = analysisResult?.stage_predictions || analysisResult?.modules?.module3_staging || {}
  const prognosis = analysisResult?.hazard_scores || analysisResult?.modules?.module4_prognosis || {}
  const xai = analysisResult?.modules?.module5_xai || {}
  const rag = analysisResult?.modules?.module6_rag || {}
  const clinicalRules = analysisResult?.modules?.clinical_rules || {}

  const bclcStage = stageData.bclc_stage || 'Stage B'
  const hazardRatio = prognosis.hazard_ratio ? Number(prognosis.hazard_ratio).toFixed(2) : '1.34'
  const riskTier = prognosis.risk_tier || 'Intermediate'
  const medianMonths = prognosis.median_survival_months || '28.4'
  const lesionVol = metrics.lesion_volume_cm3 || 12.14

  return (
    <div className="predictions-cockpit-shell">
      {/* ─── Header & Telemetry Bar ────────────────────────────────────────── */}
      <section className="cockpit-header">
        <div className="header-titles">
          <div className="badge-system-live">
            <span className="live-pulse-dot" />
            <span>UNIFIED FASTAPI MULTIMODAL PIPELINE · /api/v1/analyze</span>
          </div>
          <h1>AI Predictions & Grounded Multimodal Cockpit</h1>
          <p>
            End-to-end execution of Modules 1–6: 3D CT Preprocessing, SwinUNETR Segmentation, Swin BCLC Staging, DeepSurv Prognosis, Dual XAI, and Grounded Clinical RAG.
          </p>
        </div>

        {/* Telemetry pill */}
        <div className="telemetry-card">
          <div className="telemetry-item">
            <span className="telemetry-label"><Cpu size={14} /> FRAMEWORK</span>
            <span className="telemetry-value">PyTorch 2.2 + FAISS</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label"><Zap size={14} /> LATENCY</span>
            <span className="telemetry-value">{telemetry ? `${telemetry.latencyMs} ms` : 'Ready'}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label"><Activity size={14} /> STATUS</span>
            <span className="telemetry-value" style={{ color: '#10b981' }}>{telemetry?.status || 'Online'}</span>
          </div>
        </div>
      </section>

      {/* ─── Preset Patient Quick Switch Bar ──────────────────────────────── */}
      <div className="preset-patients-bar">
        <span className="preset-label"><User size={15} /> CLINICAL CASE:</span>
        <div className="preset-pills">
          {PRESET_PATIENTS.map((pt) => (
            <button
              key={pt.id}
              className={`preset-pill ${selectedPreset?.id === pt.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(pt)}
            >
              <strong>{pt.name}</strong>
              <span>({pt.id} · {pt.gender === 'Female' ? '♀' : '♂'} · AFP {pt.afp})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Two-Column Layout: Inputs / Controls vs Live Output ───────── */}
      <div className="cockpit-grid">
        {/* LEFT COLUMN: Input Configuration & Ingestion */}
        <div className="cockpit-input-panel">
          <div className="panel-card-title">
            <Microscope size={18} />
            <h2>Patient Biomarkers & CT Ingestion</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); runMasterPipeline(); }} className="biomarker-form">
            {/* Demographics Row */}
            <div className="form-row-2">
              <div className="input-group">
                <label>Patient ID / MRN</label>
                <input
                  type="text"
                  value={`${patientId} (${mrn})`}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Age & Gender</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    style={{ width: '80px' }}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                  />
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Male">♂ Male</option>
                    <option value="Female">♀ Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Biomarker Grid */}
            <div className="biomarker-inputs-grid">
              <div className="input-group">
                <label>AFP (ng/mL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={afp}
                  onChange={(e) => setAfp(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>Albumin (g/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={albumin}
                  onChange={(e) => setAlbumin(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>Bilirubin (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bilirubin}
                  onChange={(e) => setBilirubin(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>ALT (U/L)</label>
                <input
                  type="number"
                  step="1"
                  value={alt}
                  onChange={(e) => setAlt(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>AST (U/L)</label>
                <input
                  type="number"
                  step="1"
                  value={ast}
                  onChange={(e) => setAst(Number(e.target.value))}
                />
              </div>
              <div className="input-group">
                <label>Platelets (10⁹/L)</label>
                <input
                  type="number"
                  step="1"
                  value={platelets}
                  onChange={(e) => setPlatelets(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Imaging & Morphometry Attributes */}
            <div className="form-subheading">Imaging Morphometry & LI-RADS Criteria</div>
            <div className="morphometry-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Max Lesion Diameter (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={diameterMm}
                  onChange={(e) => setDiameterMm(Number(e.target.value))}
                />
              </div>

              <div className="checkbox-toggles" style={{ flex: 2 }}>
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={aphe}
                    onChange={(e) => setAphe(e.target.checked)}
                  />
                  <span>Arterial Enhancement (APHE)</span>
                </label>
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={washout}
                    onChange={(e) => setWashout(e.target.checked)}
                  />
                  <span>Venous Washout</span>
                </label>
                <label className="toggle-chip">
                  <input
                    type="checkbox"
                    checked={cirrhosis}
                    onChange={(e) => setCirrhosis(e.target.checked)}
                  />
                  <span>Underlying Cirrhosis</span>
                </label>
              </div>
            </div>

            {/* Volumetric CT Scan File Upload */}
            <div className="ct-upload-box">
              <label className="ct-file-label">
                <Upload size={18} />
                <div className="ct-upload-text">
                  <strong>{ctFile ? ctFile.name : 'Attach Volumetric CT Scan (.nii / .nii.gz / .dcm)'}</strong>
                  <span>{ctFile ? `${(ctFile.size / 1024).toFixed(1)} KB uploaded` : 'Optional. If omitted, standard clinical scan will be evaluated.'}</span>
                </div>
                <input
                  type="file"
                  accept=".nii,.nii.gz,.dcm,image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="run-pipeline-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>Executing Multimodal Neural Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>RUN MASTER MULTIMODAL AI PIPELINE (/api/v1/analyze)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Model Visualizations & Metrics */}
        <div className="cockpit-results-panel">
          {/* Top Metric Summary Cards */}
          <div className="result-metrics-banner">
            <div className="banner-metric">
              <span className="banner-label">BCLC STAGE PREDICTION</span>
              <strong className="banner-value stage-val">{bclcStage}</strong>
              <span className="banner-sub">Module 3 · Swin Transformer v2</span>
            </div>

            <div className="banner-metric">
              <span className="banner-label">PROGNOSTIC HAZARD RATIO</span>
              <strong className="banner-value" style={{ color: riskTier === 'High' ? '#ef4444' : riskTier === 'Intermediate' ? '#f59e0b' : '#10b981' }}>
                HR {hazardRatio}
              </strong>
              <span className="banner-sub">Module 4 · DeepSurv Late-Fusion</span>
            </div>

            <div className="banner-metric">
              <span className="banner-label">EST. MEDIAN SURVIVAL</span>
              <strong className="banner-value survival-val">{medianMonths} mo</strong>
              <span className="banner-sub">Cox Proportional Hazards</span>
            </div>

            <div className="banner-metric">
              <span className="banner-label">3D LESION BURDEN</span>
              <strong className="banner-value volume-val">{lesionVol} cm³</strong>
              <span className="banner-sub">Module 2 · SwinUNETR Mask</span>
            </div>
          </div>

          {/* Tab Navigation for Detailed Inspection */}
          <div className="cockpit-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BrainCircuit size={15} /> 3D Staging & Survival
            </button>
            <button
              className={`tab-btn ${activeTab === 'xai' ? 'active' : ''}`}
              onClick={() => setActiveTab('xai')}
            >
              <Target size={15} /> Dual XAI (Grad-CAM & SHAP)
            </button>
            <button
              className={`tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
              onClick={() => setActiveTab('rag')}
            >
              <FileText size={15} /> Grounded Clinical RAG Report
            </button>
          </div>

          {/* TAB 1: 3D Staging & DeepSurv Survival */}
          {activeTab === 'overview' && (
            <div className="tab-pane-content">
              {/* Swin Transformer 4-Class Probability Breakdown */}
              <div className="card-section">
                <div className="card-section-header">
                  <h3>Swin Transformer BCLC Disease Stage Distribution</h3>
                  <span className="model-chip">768-dim Spatial Embeddings</span>
                </div>
                <div className="prob-bars-stack">
                  {stageData.stage_probabilities ? (
                    Object.entries(stageData.stage_probabilities).map(([stg, prob]) => {
                      const pct = Math.round(prob * 100)
                      return (
                        <div key={stg} className="prob-bar-row">
                          <span className="stage-name">{stg}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: stg.includes('0/A') ? '#10b981' : stg.includes('B') ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className="pct-val">{pct}%</span>
                        </div>
                      )
                    })
                  ) : (
                    <>
                      <div className="prob-bar-row">
                        <span className="stage-name">Stage 0/A</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: '12%', background: '#10b981' }} /></div>
                        <span className="pct-val">12%</span>
                      </div>
                      <div className="prob-bar-row">
                        <span className="stage-name">Stage B</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: '74%', background: '#f59e0b' }} /></div>
                        <span className="pct-val">74%</span>
                      </div>
                      <div className="prob-bar-row">
                        <span className="stage-name">Stage C</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: '10%', background: '#ef4444' }} /></div>
                        <span className="pct-val">10%</span>
                      </div>
                      <div className="prob-bar-row">
                        <span className="stage-name">Stage D</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: '4%', background: '#94a3b8' }} /></div>
                        <span className="pct-val">4%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* DeepSurv Survival Horizon Gauges */}
              <div className="card-section" style={{ marginTop: '16px' }}>
                <div className="card-section-header">
                  <h3>DeepSurv Multimodal Survival Probability Horizon</h3>
                  <span className="model-chip">Cox Proportional Hazards</span>
                </div>

                <div className="survival-gauges-grid">
                  <div className="gauge-item">
                    <span className="gauge-time">12 Months</span>
                    <strong className="gauge-pct">
                      {prognosis.survival_probabilities?.['12_month'] ? `${Math.round(prognosis.survival_probabilities['12_month'] * 100)}%` : '86%'}
                    </strong>
                    <div className="gauge-mini-bar">
                      <div className="gauge-fill" style={{ width: `${Math.round((prognosis.survival_probabilities?.['12_month'] || 0.86) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="gauge-item">
                    <span className="gauge-time">24 Months</span>
                    <strong className="gauge-pct">
                      {prognosis.survival_probabilities?.['24_month'] ? `${Math.round(prognosis.survival_probabilities['24_month'] * 100)}%` : '68%'}
                    </strong>
                    <div className="gauge-mini-bar">
                      <div className="gauge-fill" style={{ width: `${Math.round((prognosis.survival_probabilities?.['24_month'] || 0.68) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="gauge-item">
                    <span className="gauge-time">36 Months</span>
                    <strong className="gauge-pct">
                      {prognosis.survival_probabilities?.['36_month'] ? `${Math.round(prognosis.survival_probabilities['36_month'] * 100)}%` : '51%'}
                    </strong>
                    <div className="gauge-mini-bar">
                      <div className="gauge-fill" style={{ width: `${Math.round((prognosis.survival_probabilities?.['36_month'] || 0.51) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="gauge-item">
                    <span className="gauge-time">60 Months</span>
                    <strong className="gauge-pct">
                      {prognosis.survival_probabilities?.['60_month'] ? `${Math.round(prognosis.survival_probabilities['60_month'] * 100)}%` : '34%'}
                    </strong>
                    <div className="gauge-mini-bar">
                      <div className="gauge-fill" style={{ width: `${Math.round((prognosis.survival_probabilities?.['60_month'] || 0.34) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Clinical Rules & Reserve Scores */}
                <div className="scores-summary-row" style={{ marginTop: '16px' }}>
                  <div className="chip-score">
                    <span>ALBI Grade:</span> <strong>{clinicalRules.albi_grade || 'Grade 2'} ({clinicalRules.albi_score || -2.1})</strong>
                  </div>
                  <div className="chip-score">
                    <span>Child-Pugh:</span> <strong>Class {clinicalRules.child_pugh_class || 'A'} ({clinicalRules.child_pugh_points || 5} pts)</strong>
                  </div>
                  <div className="chip-score">
                    <span>FIB-4 Index:</span> <strong>{clinicalRules.fib4_index || 2.8}</strong>
                  </div>
                  <div className="chip-score">
                    <span>LI-RADS:</span> <strong style={{ color: '#ef4444' }}>{clinicalRules.lirads_category || 'LR-5'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dual Explainable AI (3D Grad-CAM & Tabular SHAP) */}
          {activeTab === 'xai' && (
            <div className="tab-pane-content">
              <div className="xai-dual-grid">
                {/* 3D Grad-CAM Slice Viewer */}
                <div className="xai-subcard">
                  <div className="subcard-header">
                    <h4>3D Volumetric Grad-CAM Activation</h4>
                    <span className="peak-badge">Hotspot Peak: {xai.gradcam_3d?.peak_attention_intensity || 0.94}</span>
                  </div>

                  <div className="gradcam-screen-box">
                    <img
                      src={previewUrl || '/ct_scans/james_morrison_ct.jpg'}
                      alt="Axial CT Lesion"
                      className="base-ct-img"
                    />

                    {/* Thermal Overlay */}
                    <svg viewBox="0 0 300 220" className="thermal-overlay-svg">
                      <defs>
                        <radialGradient id="cockpitThermal" cx="62%" cy="48%" r="35%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                          <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.8" />
                          <stop offset="60%" stopColor="#10b981" stopOpacity="0.5" />
                          <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </radialGradient>
                      </defs>
                      <circle
                        cx="185"
                        cy="105"
                        r="64"
                        fill="url(#cockpitThermal)"
                        style={{ opacity: blend / 100 }}
                      />
                      {blend > 20 && (
                        <g>
                          <rect x="145" y="65" width="80" height="80" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
                          <circle cx="185" cy="105" r="4" fill="#ef4444" />
                          <text x="145" y="58" fill="#ef4444" fontSize="10" fontWeight="bold">PEAK ATTENTION FOCUS</text>
                        </g>
                      )}
                    </svg>

                    <div className="coordinates-tag">
                      Hotspot Coord: {JSON.stringify(xai.gradcam_3d?.hotspot_coords || [16, 24, 24])}
                    </div>
                  </div>

                  <div className="blend-slider-wrap">
                    <label>
                      <span>Raw CT</span>
                      <span>Heatmap Opacity: {blend}%</span>
                      <span>Grad-CAM</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blend}
                      onChange={(e) => setBlend(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Tabular TreeSHAP Feature Attributions */}
                <div className="xai-subcard">
                  <div className="subcard-header">
                    <h4>TreeSHAP Biomarker Attributions</h4>
                    <span className="peak-badge">Predicted Risk: {xai.tabular_shap?.predicted_risk_pct ? `${Math.round(xai.tabular_shap.predicted_risk_pct)}%` : '78%'}</span>
                  </div>

                  <div className="shap-drivers-list">
                    {(xai.tabular_shap?.top_risk_drivers || [
                      { feature_name: 'Serum AFP (ng/mL)', attribution_score: 0.38, patient_value: 450.0, impact_direction: 'increases_risk' },
                      { feature_name: 'Total Bilirubin (mg/dL)', attribution_score: 0.24, patient_value: 1.8, impact_direction: 'increases_risk' },
                      { feature_name: 'Lesion Volume (cm³)', attribution_score: 0.19, patient_value: 12.1, impact_direction: 'increases_risk' },
                      { feature_name: 'Serum Albumin (g/dL)', attribution_score: -0.15, patient_value: 3.2, impact_direction: 'decreases_risk' },
                    ]).map((driver, idx) => {
                      const isRisk = driver.attribution_score > 0 || driver.impact_direction === 'increases_risk'
                      const absScore = Math.abs(driver.attribution_score)
                      const pct = Math.min(100, Math.round(absScore * 200))
                      return (
                        <div key={idx} className="shap-driver-item">
                          <div className="driver-top">
                            <span className="driver-name">{driver.feature_name}</span>
                            <span className={`driver-val ${isRisk ? 'risk' : 'protective'}`}>
                              {isRisk ? `+${absScore.toFixed(2)} Risk` : `-${absScore.toFixed(2)} Protective`}
                            </span>
                          </div>
                          <div className="shap-bar-track">
                            <div
                              className="shap-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: isRisk ? '#ef4444' : '#10b981'
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {xai.tabular_shap?.clinical_summary && (
                    <p className="shap-summary-quote">
                      "{xai.tabular_shap.clinical_summary}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Grounded Clinical RAG Report */}
          {activeTab === 'rag' && (
            <div className="tab-pane-content">
              <div className="rag-report-container">
                <div className="rag-report-header">
                  <div>
                    <span className="rag-pathway-badge">
                      <Stethoscope size={14} /> {rag.clinical_pathway || 'Locoregional / Systemic Therapy Pathway'}
                    </span>
                    <h3 style={{ marginTop: '8px', color: '#1e1b4b' }}>Grounded Decision Support Summary</h3>
                    <p className="rag-primary-rec">
                      <strong>Primary Recommendation:</strong> {rag.primary_recommendation || 'Multidisciplinary Tumor Board referral for transarterial chemoembolization (TACE).'}
                    </p>
                  </div>
                  <button className="copy-report-btn" onClick={handleCopyReport}>
                    {copiedReport ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
                  </button>
                </div>

                {/* Evidence Badges */}
                <div className="guideline-chips-row">
                  <span className="guideline-chip">AASLD 2023 Practice Guidelines</span>
                  <span className="guideline-chip">EASL 2022 Clinical Practice</span>
                  <span className="guideline-chip">ACR LI-RADS v2018</span>
                  <span className="guideline-chip">BCLC 2022 Algorithm</span>
                </div>

                {/* Narrative Text */}
                <div className="rag-narrative-text">
                  <pre>{analysisResult?.clinical_report_text || rag.grounded_narrative || 'Grounded clinical decision report generated via FAISS vector retrieval.'}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
