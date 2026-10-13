import React, { useState } from 'react'
import { BrainCircuit, Check, Copy, Table, Code } from 'lucide-react'

export const SUBSYSTEM_METRICS = [
  {
    subsystem: '3D Volumetric Segmentation (nnU-Net)',
    metric: 'Dice Similarity Coefficient (DSC)',
    score: '≥ 0.90',
    color: '#00f2fe'
  },
  {
    subsystem: 'Pathology Classifier (ConvNeXt-Small)',
    metric: 'AUC-ROC Score',
    score: '91.4%',
    color: '#10b981'
  },
  {
    subsystem: 'Multimodal Survival Prognosis (DeepSurv)',
    metric: 'Concordance Index (C-Index)',
    score: '0.78',
    color: '#c084fc'
  },
  {
    subsystem: 'Knowledge-Grounded Reporting (LangChain RAG)',
    metric: 'Guideline Grounding Confidence',
    score: '94.2%',
    color: '#3b82f6'
  },
  {
    subsystem: 'Asynchronous API Gateway (FastAPI/Celery)',
    metric: 'Mean Response Latency',
    score: '142 ms',
    color: '#f59e0b'
  }
]

export const LATEX_TABLE_STRING = `$$\\begin{array}{|l|l|c|} \\hline \\textbf{Subsystem / Engine} & \\textbf{Core Metric} & \\textbf{Performance Score} \\\\ \\hline \\text{3D Volumetric Segmentation (nnU-Net)} & \\text{Dice Similarity Coefficient (DSC)} & \\mathbf{\\ge 0.90} \\\\ \\hline \\text{Pathology Classifier (ConvNeXt-Small)} & \\text{AUC-ROC Score} & \\mathbf{91.4\\%} \\\\ \\hline \\text{Multimodal Survival Prognosis (DeepSurv)} & \\text{Concordance Index (C-Index)} & \\mathbf{0.78} \\\\ \\hline \\text{Knowledge-Grounded Reporting (LangChain RAG)} & \\text{Guideline Grounding Confidence} & \\mathbf{94.2\\%} \\\\ \\hline \\text{Asynchronous API Gateway (FastAPI/Celery)} & \\text{Mean Response Latency} & \\mathbf{142\\text{ ms}} \\\\ \\hline \\end{array}$$`

export default function SubsystemPerformanceCard({ onNotice }) {
  const [viewMode, setViewMode] = useState('table') // 'table' | 'latex'
  const [copied, setCopied] = useState(false)

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(LATEX_TABLE_STRING)
    setCopied(true)
    if (onNotice) onNotice('LaTeX table markup copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel subsystem-performance-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#00f2fe', marginBottom: '4px' }}>
            <BrainCircuit size={14} /> HEPA-COPILOT AI ENGINE BENCHMARKS
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            Subsystem Core Metrics & Performance Scorecard
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
            Quantitative clinical decision-support telemetry across deep learning pipelines and API execution engines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Table size={13} /> Visual Table
            </button>
            <button
              onClick={() => setViewMode('latex')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                background: viewMode === 'latex' ? '#3b82f6' : 'transparent',
                color: viewMode === 'latex' ? '#ffffff' : '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Code size={13} /> LaTeX Code
            </button>
          </div>

          {viewMode === 'latex' && (
            <button
              onClick={handleCopyLatex}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: '#00f2fe',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy LaTeX'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(9, 13, 22, 0.6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e2e8f0', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#f8fafc' }}>Subsystem / Engine</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#f8fafc' }}>Core Metric</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', color: '#f8fafc', textAlign: 'center' }}>Performance Score</th>
              </tr>
            </thead>
            <tbody>
              {SUBSYSTEM_METRICS.map((row, index) => (
                <tr key={index} style={{ borderBottom: index < SUBSYSTEM_METRICS.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '600', color: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.color }} />
                      {row.subsystem}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                    {row.metric}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '13px',
                        color: row.color,
                        background: `${row.color}1a`,
                        border: `1px solid ${row.color}44`,
                        boxShadow: `0 0 10px ${row.color}22`
                      }}
                    >
                      {row.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '16px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: '#00f2fe', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {LATEX_TABLE_STRING}
          </pre>
        </div>
      )}
    </div>
  )
}
