import React from 'react'
import { Activity, Stethoscope, Building2, FlaskConical, ArrowRight, ShieldCheck, Sparkles, UserCheck, Layers, BrainCircuit } from 'lucide-react'

export default function LandingPortalSelect({ onNavigate }) {
  return (
    <div className="landing-portal-shell">
      {/* Ambient Pastel Animated Glow Mesh Orbs */}
      <div className="ambient-pastel-mesh" aria-hidden="true">
        <div className="pastel-orb orb-purple" />
        <div className="pastel-orb orb-white" />
        <div className="pastel-orb orb-pink" />
        <div className="pastel-orb orb-lavender" />
      </div>

      {/* Top Brand Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-logo-wrap">
            <img 
              src="/hepato_copilot_logo_transparent.png" 
              alt="HepatoCopilot Logo" 
              className="brand-logo-img" 
            />
          </div>
          <div className="brand-titles">
            <span className="brand-text">Hepato<span className="green-highlight">Copilot</span></span>
            <div className="brand-subtext-badge">
              <span className="subtext-pulse-dot" />
              <span>Clinical Intelligence System</span>
            </div>
          </div>
        </div>

        <div className="system-status-chip">
          <span className="live-dot" />
          <span>Unified FastAPI AI Backend Active</span>
        </div>
      </header>

      {/* Hero Headline */}
      <main className="landing-hero-content">
        <div className="hero-eyebrow">
          <Sparkles size={16} />
          <span>AI-ASSISTED LIVER CANCER PREDICTION & CLINICAL DECISION SUPPORT PLATFORM</span>
        </div>

        <h1 className="landing-hero-title">
          Enterprise Healthcare AI Ecosystem
        </h1>

        <p className="landing-hero-subtitle">
          Select your role-specific clinical portal to sign in. Every portal communicates with a shared, secure backend with Role-Based Access Control (RBAC).
        </p>

        {/* 3 Portal Selection Cards */}
        <div className="portal-cards-grid">
          {/* Card 1: DOCTOR PORTAL */}
          <div className="portal-card doctor-card" onClick={() => onNavigate('/doctor/login')}>
            <div className="card-badge doctor-badge">
              <Stethoscope size={18} />
              <span>DOCTOR PORTAL</span>
            </div>

            <div className="card-body">
              <h2>Clinical & AI Intelligence</h2>
              <p>
                Patient assessments, ConvNeXt pathology predictions, nnU-Net 3D imaging, SHAP explainability, RAG Copilot, and Longitudinal Timeline.
              </p>

              <ul className="portal-feature-list">
                <li><UserCheck size={14} /> Assigned Patient Roster</li>
                <li><BrainCircuit size={14} /> Multimodal Risk & Prognosis</li>
                <li><Layers size={14} /> DICOM/NIfTI 3D Slice Viewer</li>
              </ul>
            </div>

            <div className="card-action">
              <button className="portal-login-btn doctor-btn">
                <span>Login to Doctor Portal</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Card 2: HOSPITAL PORTAL */}
          <div className="portal-card hospital-card" onClick={() => onNavigate('/hospital/login')}>
            <div className="card-badge hospital-badge">
              <Building2 size={18} />
              <span>HOSPITAL PORTAL</span>
            </div>

            <div className="card-body">
              <h2>Operations & Analytics</h2>
              <p>
                Hospital-wide monitoring, department metrics, doctor activity tracking, patient volume analytics, and immutable security audit logging.
              </p>

              <ul className="portal-feature-list">
                <li><Building2 size={14} /> Department Statistics</li>
                <li><UserCheck size={14} /> Doctor Roster & RBAC Management</li>
                <li><ShieldCheck size={14} /> System Audit Trail</li>
              </ul>
            </div>

            <div className="card-action">
              <button className="portal-login-btn hospital-btn">
                <span>Login to Hospital Portal</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Card 3: LAB PORTAL */}
          <div className="portal-card lab-card" onClick={() => onNavigate('/lab/login')}>
            <div className="card-badge lab-badge">
              <FlaskConical size={18} />
              <span>LAB PORTAL</span>
            </div>

            <div className="card-body">
              <h2>Workflow & Verification</h2>
              <p>
                Laboratory test order tracking, sample intake pipeline, automated report OCR processing, and technician verification workflow.
              </p>

              <ul className="portal-feature-list">
                <li><FlaskConical size={14} /> Test Order Pipeline</li>
                <li><Sparkles size={14} /> AI-Powered Report OCR</li>
                <li><ShieldCheck size={14} /> Result Verification & Signing</li>
              </ul>
            </div>

            <div className="card-action">
              <button className="portal-login-btn lab-btn">
                <span>Login to Lab Portal</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>HepatoCopilot Clinical Decision Support Platform v2.4 · HIPAA & Role-Based Access Control Compliant</p>
      </footer>
    </div>
  )
}
