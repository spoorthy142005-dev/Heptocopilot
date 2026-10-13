import React from 'react'
import App from '../../App'

export default function DoctorPortalLayout({ user, onLogout }) {
  // DoctorPortalLayout reuses and renders the full Doctor Clinical Dashboard App with Doctor Portal Navigation & Context
  return (
    <div className="doctor-portal-wrapper">
      <App initialUser={user} onLogout={onLogout} />
    </div>
  )
}
