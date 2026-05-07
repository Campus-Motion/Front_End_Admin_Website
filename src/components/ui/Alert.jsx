import { Icon } from './Icons'

export function Alert({ variant = 'error', message, onDismiss }) {
  if (!message) return null
  return (
    <div className={`alert alert-${variant}`} role="alert">
      <Icon name={variant === 'error' ? 'alert' : 'check'} size={16} />
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ marginLeft: 'auto', opacity: 0.6, lineHeight: 1 }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}
