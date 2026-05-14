const PHONE = '595975404228'
const DISPLAY = '+595 975 404228'
const DEFAULT_TEXT = 'Hola, necesito ayuda con Allways Show de Premios.'

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.11 17.56c-.27-.13-1.59-.78-1.84-.87-.25-.09-.43-.13-.6.13-.18.27-.7.86-.86 1.04-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.33-.8-.71-1.34-1.6-1.49-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.46.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.06-.13-.6-1.46-.83-2-.22-.53-.45-.46-.6-.46l-.51-.01c-.18 0-.47.07-.71.34-.25.27-.94.92-.94 2.25 0 1.33.97 2.61 1.1 2.79.13.18 1.9 2.91 4.61 4.08.64.28 1.15.45 1.54.57.65.21 1.23.18 1.69.11.52-.08 1.59-.65 1.81-1.27.22-.62.22-1.15.16-1.27-.07-.11-.25-.18-.51-.32zM16.04 5.33c-5.91 0-10.71 4.8-10.71 10.7 0 1.88.5 3.72 1.45 5.33L5.32 26.5l5.27-1.38a10.66 10.66 0 0 0 5.45 1.5h.01c5.9 0 10.7-4.8 10.7-10.7 0-2.85-1.11-5.54-3.12-7.56a10.61 10.61 0 0 0-7.59-3.03zm6.21 16.91c-.26.74-1.53 1.42-2.14 1.51-.55.08-1.24.12-1.99-.13-.46-.15-1.06-.34-1.83-.68-3.22-1.39-5.32-4.62-5.48-4.84-.16-.21-1.31-1.74-1.31-3.32 0-1.58.83-2.36 1.12-2.68.29-.32.64-.4.85-.4l.61.01c.2 0 .47-.07.73.56.27.65.92 2.24.99 2.4.07.16.12.35.02.55-.09.21-.14.34-.27.52-.13.18-.27.4-.39.53-.13.13-.26.28-.11.55.15.27.66 1.08 1.42 1.74.97.85 1.79 1.11 2.06 1.24.27.13.43.11.59-.07.16-.18.66-.77.84-1.04.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.87.27.13.45.2.51.32.07.11.07.65-.16 1.27z" />
    </svg>
  )
}

export default function WhatsAppSAC({
  variant = 'floating',
  theme = 'light',
  text = DEFAULT_TEXT,
  label,
}) {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`

  if (variant === 'inline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition-all ${
          theme === 'dark'
            ? 'bg-green-500 text-white hover:bg-green-400'
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
        aria-label={`Hablar con SAC por WhatsApp ${DISPLAY}`}
      >
        <WhatsAppIcon size={18} />
        {label || (
          <span>
            SAC · <span className="font-mono">{DISPLAY}</span>
          </span>
        )}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl pl-3 pr-4 py-3 font-semibold text-sm transition-all hover:scale-105 active:scale-95"
      aria-label={`Hablar con SAC por WhatsApp ${DISPLAY}`}
    >
      <span className="relative flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-green-400 opacity-60 animate-ping" />
        <WhatsAppIcon size={22} />
      </span>
      <span className="hidden sm:inline whitespace-nowrap">
        ¿Dudas? <span className="font-bold">SAC</span>
      </span>
    </a>
  )
}
