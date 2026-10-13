import React, { useState } from 'react'
import { Building2, LockKeyhole, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

export default function HospitalLoginPage({ onLoginSuccess, onBackToLanding }) {
  const [email, setEmail]       = useState('admin@northstar-health.org')
  const [password, setPassword] = useState('••••••••••••')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your hospital administrator email.')
      return
    }
    // Authenticate as HOSPITAL_ADMIN
    onLoginSuccess({
      email,
      name: 'Admin Sarah Jenkins',
      role: 'HOSPITAL_ADMIN',
      department: 'Hospital Operations & IT',
      token: 'jwt-hospital-admin-token-99021'
    })
  }

  return (
    <div className="portal-login-container hospital-portal-login">
      <button className="back-landing-btn" onClick={onBackToLanding}>
        <ArrowLeft size={16} /> Back to Portals
      </button>

      <div className="login-card hospital-login-card">
        <div className="portal-shield-icon hospital-icon-wrap">
          <Building2 size={32} />
        </div>

        <div className="login-card-header">
          <h2>Hospital Operations Portal</h2>
          <p>Manage hospital departments, doctor accounts, analytics, and audit logging</p>
        </div>

        <form onSubmit={submit} className="portal-login-form">
          <div className="input-field">
            <label>Hospital Admin Email</label>
            <div className="input-wrap">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                placeholder="admin@northstar-health.org"
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
              <span>Remember administrator credentials</span>
            </label>
            <button type="button" className="forgot-btn" onClick={() => setError('Password reset sent to IT Security Team.')}>
              Forgot Password?
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="login-submit-btn hospital-submit-btn">
            <ShieldCheck size={18} /> Access Hospital Operations Portal
          </button>
        </form>

        <div className="login-card-foot">
          <small>Role Security Level: <strong>HOSPITAL_ADMIN (Operational Oversight & User Management)</strong></small>
        </div>
      </div>
    </div>
  )
}
