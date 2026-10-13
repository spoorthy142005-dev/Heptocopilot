import React, { useState } from 'react'
import { Stethoscope, LockKeyhole, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

export default function DoctorLoginPage({ onLoginSuccess, onBackToLanding }) {
  const [email, setEmail]       = useState('dr.chen@northstar-health.org')
  const [password, setPassword] = useState('••••••••••••')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your clinical email or Doctor ID.')
      return
    }
    // Authenticate as DOCTOR
    onLoginSuccess({
      email,
      name: 'Dr. Riley Chen',
      role: 'DOCTOR',
      department: 'Hepatology & Oncology',
      token: 'jwt-doctor-token-88401'
    })
  }

  return (
    <div className="portal-login-container doctor-portal-login">
      <button className="back-landing-btn" onClick={onBackToLanding}>
        <ArrowLeft size={16} /> Back to Portals
      </button>

      <div className="login-card doctor-login-card">
        <div className="portal-shield-icon doctor-icon-wrap">
          <Stethoscope size={32} />
        </div>

        <div className="login-card-header">
          <h2>Doctor Portal Sign-In</h2>
          <p>Access patient history, AI prediction engines, and clinical decision tools</p>
        </div>

        <form onSubmit={submit} className="portal-login-form">
          <div className="input-field">
            <label>Clinical Email / Doctor ID</label>
            <div className="input-wrap">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                placeholder="dr.chen@northstar-health.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-field">
            <label>Password</label>
            <div className="input-wrap">
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
          </div>

          <div className="form-options">
            <label className="checkbox-wrap">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Keep clinical session active</span>
            </label>
            <button type="button" className="forgot-btn" onClick={() => setError('Password reset instructions sent to clinical admin.')}>
              Forgot Password?
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="login-submit-btn doctor-submit-btn">
            <ShieldCheck size={18} /> Authenticate & Access Doctor Portal
          </button>
        </form>

        <div className="login-card-foot">
          <small>Role Security Level: <strong>DOCTOR (Clinical Assessment & AI Access)</strong></small>
        </div>
      </div>
    </div>
  )
}
