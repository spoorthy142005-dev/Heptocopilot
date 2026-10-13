import React, { useState } from 'react'
import { FlaskConical, LockKeyhole, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

export default function LabLoginPage({ onLoginSuccess, onBackToLanding }) {
  const [email, setEmail]       = useState('lab.tech@northstar-health.org')
  const [password, setPassword] = useState('••••••••••••')
  const [showPw, setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError]       = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your laboratory credentials.')
      return
    }
    // Authenticate as LAB_ADMIN / LAB_TECHNICIAN
    onLoginSuccess({
      email,
      name: 'Tech Alex Mercer',
      role: 'LAB_ADMIN',
      department: 'Clinical Pathology Laboratory',
      token: 'jwt-lab-admin-token-77104'
    })
  }

  return (
    <div className="portal-login-container lab-portal-login">
      <button className="back-landing-btn" onClick={onBackToLanding}>
        <ArrowLeft size={16} /> Back to Portals
      </button>

      <div className="login-card lab-login-card">
        <div className="portal-shield-icon lab-icon-wrap">
          <FlaskConical size={32} />
        </div>

        <div className="login-card-header">
          <h2>Laboratory Portal Sign-In</h2>
          <p>Process test orders, sample tracking, report OCR extraction & lab verification</p>
        </div>

        <form onSubmit={submit} className="portal-login-form">
          <div className="input-field">
            <label>Lab Staff Email / Technician ID</label>
            <div className="input-wrap">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                placeholder="lab.tech@northstar-health.org"
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
              <span>Remember lab station session</span>
            </label>
            <button type="button" className="forgot-btn" onClick={() => setError('Password reset instructions sent to Pathology Director.')}>
              Forgot Password?
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="login-submit-btn lab-submit-btn">
            <ShieldCheck size={18} /> Access Laboratory Portal
          </button>
        </form>

        <div className="login-card-foot">
          <small>Role Security Level: <strong>LAB_ADMIN (Order Intake & Verification Workflow)</strong></small>
        </div>
      </div>
    </div>
  )
}
