import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'allways_pwa_dismissed_at'
const DISMISS_HOURS = 72

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_HOURS * 60 * 60 * 1000) return

    const handler = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      dismiss()
    }
  }

  if (!show || !deferred) return null

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-allways-dark border border-allways-gold/40 rounded-2xl shadow-gold-lg p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-allways-gold/20 flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-allways-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Instalar Allways</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Acceso rapido desde tu pantalla de inicio. Sin descargas adicionales.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="bg-allways-gold text-allways-dark text-xs font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition"
            >
              Instalar
            </button>
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-white px-2"
            >
              Mas tarde
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-gray-500 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
