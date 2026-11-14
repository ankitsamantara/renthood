import { CircleCheck, Info, X } from 'lucide-react'
import { useApp } from '../store'

export function Toast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null

  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      {toast.tone === 'success' ? <CircleCheck size={19} /> : <Info size={19} />}
      <span>{toast.message}</span>
      <button type="button" onClick={dismissToast} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  )
}
