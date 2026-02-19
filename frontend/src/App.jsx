import { useState, useRef } from 'react'

// ── Configure base path here (no trailing slash) ──────────────────────────────
const BASE_PATH = import.meta.env.VITE_BASE_PATH || ''
const MAX_BYTES = 1 * 1024 * 1024 // 1 MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [receipt, setReceipt] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef()

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setStatus('idle')
    setErrorMsg('')
    setReceipt('')

    if (selected.size > MAX_BYTES) {
      setErrorMsg(`File is too large (${formatBytes(selected.size)}). Maximum allowed size is 1 MB.`)
      setStatus('error')
      setFile(null)
      e.target.value = ''
      return
    }
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setErrorMsg('')
    setReceipt('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${BASE_PATH}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      if (res.status === 413) {
        throw new Error('File exceeds the 1 MB limit (rejected by server).')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Upload failed (HTTP ${res.status}).`)
      }

      const data = await res.json()
      setReceipt(data.receipt)
      setStatus('success')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setErrorMsg(err.message || 'Unknown error occurred.')
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setFile(null)
    setReceipt('')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="page">
      <div className="card">
        <header className="card-header">
          <div className="logo-mark">▲</div>
          <h1>VAULT</h1>
          <p className="subtitle">Secure one-shot file transfer</p>
        </header>

        <div className="card-body">
          {status !== 'success' && (
            <>
              <label className={`drop-zone ${file ? 'has-file' : ''} ${status === 'error' ? 'has-error' : ''}`}>
                <input
                  ref={inputRef}
                  type="file"
                  className="visually-hidden"
                  onChange={handleFileChange}
                  disabled={status === 'uploading'}
                />
                {file ? (
                  <div className="file-info">
                    <span className="file-icon">◈</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatBytes(file.size)}</span>
                  </div>
                ) : (
                  <div className="drop-hint">
                    <span className="drop-icon">⊕</span>
                    <span>Click to select a file</span>
                    <span className="size-note">Max 1 MB</span>
                  </div>
                )}
              </label>

              {status === 'error' && (
                <div className="message error-message">
                  <span className="msg-icon">✕</span>
                  {errorMsg}
                </div>
              )}

              <button
                className="upload-btn"
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
              >
                {status === 'uploading' ? (
                  <><span className="spinner" /> Uploading…</>
                ) : 'Upload'}
              </button>
            </>
          )}

          {status === 'success' && (
            <div className="receipt-panel">
              <div className="receipt-icon">✓</div>
              <p className="receipt-label">Transfer complete. Your receipt:</p>
              <code className="receipt-code">{receipt}</code>
              <p className="receipt-note">Keep this number for your records.</p>
              <button className="reset-btn" onClick={reset}>Upload another</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
