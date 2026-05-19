import { useRef, useState } from 'react'
import { newsApi } from '../../api'
import { Icon } from '../ui/Icons'
import './PhotoUploader.css'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * PhotoUploader
 * Props:
 *   articleId  — news article ID (required to POST /news/:id/photo)
 *   currentUrl — existing photourl from the article (shown as current preview)
 *   onUploaded — called with the returned photourl string after a successful upload
 */
export function PhotoUploader({ articleId, currentUrl, onUploaded }) {
  const inputRef   = useRef(null)
  const [preview,  setPreview]  = useState(null)   // local object URL
  const [file,     setFile]     = useState(null)
  const [progress, setProgress] = useState(null)   // 'uploading' | 'done' | null
  const [error,    setError]    = useState('')
  const [dragging, setDragging] = useState(false)

  /* ── file validation ─────────────────────── */
  const validate = f => {
    if (!ACCEPTED.includes(f.type))
      return 'Only JPEG, PNG, and WebP images are allowed.'
    if (f.size > MAX_BYTES)
      return `File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`
    return null
  }

  const pick = f => {
    setError('')
    const err = validate(f)
    if (err) { setError(err); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setProgress(null)
  }

  /* ── upload ──────────────────────────────── */
  const handleUpload = async () => {
    if (!file) return
    setProgress('uploading')
    setError('')
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await newsApi.uploadPhoto(articleId, fd)
      setProgress('done')
      onUploaded?.(res?.photourl ?? res?.photo_url)
      // keep the local preview visible after success
    } catch (err) {
      setError(err.message ?? 'Upload failed.')
      setProgress(null)
    }
  }

  const handleDiscard = () => {
    setFile(null)
    setPreview(null)
    setProgress(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── drag & drop ─────────────────────────── */
  const onDragOver = e => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = e => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pick(f)
  }

  /* ── displayed image ─────────────────────── */
  const displayUrl = preview ?? currentUrl ?? null

  return (
    <div className="photo-uploader">

      {/* Drop zone / preview area */}
      <div
        className={`photo-drop-zone ${dragging ? 'dragging' : ''} ${displayUrl ? 'has-image' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photo"
        onKeyDown={e => e.key === 'Enter' && !file && inputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Article photo preview"
            className="photo-preview-img"
          />
        ) : (
          <div className="photo-drop-hint">
            <Icon name="plus" size={22} />
            <span>Drop image here or <strong>click to browse</strong></span>
            <span className="photo-drop-sub">JPEG · PNG · WebP · max 10 MB</span>
          </div>
        )}

        {/* Success overlay */}
        {progress === 'done' && (
          <div className="photo-success-overlay">
            <Icon name="check" size={20} />
            Uploaded
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) pick(f) }}
      />

      {/* Error */}
      {error && (
        <p className="photo-error">
          <Icon name="alert" size={13} />
          {error}
        </p>
      )}

      {/* Action bar — only shown when a new file is staged */}
      {file && progress !== 'done' && (
        <div className="photo-actions">
          <span className="photo-filename">
            <Icon name="eye" size={13} />
            {file.name} &nbsp;·&nbsp; {(file.size / 1024).toFixed(0)} KB
          </span>
          <div style={{ display:'flex', gap:'var(--space-2)', marginLeft:'auto' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleDiscard}
              disabled={progress === 'uploading'}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleUpload}
              disabled={progress === 'uploading'}
            >
              {progress === 'uploading' ? (
                <>
                  <span className="spinner" style={{ width:13, height:13, borderWidth:2 }} />
                  Uploading…
                </>
              ) : (
                <>
                  <Icon name="plus" size={13} />
                  Upload photo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Change button after successful upload */}
      {progress === 'done' && (
        <div className="photo-actions">
          <span className="photo-filename" style={{ color:'var(--color-success)' }}>
            <Icon name="check" size={13} />
            Photo updated successfully
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginLeft:'auto' }}
            onClick={handleDiscard}
          >
            Change
          </button>
        </div>
      )}

      {/* "Replace" link when there's an existing photo but no new file staged */}
      {currentUrl && !file && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop:'var(--space-2)', width:'100%' }}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="edit" size={13} />
          Replace photo
        </button>
      )}
    </div>
  )
}
