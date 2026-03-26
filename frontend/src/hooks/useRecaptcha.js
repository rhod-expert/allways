const SITE_KEY = '6LfF44AsAAAAAKuLj-jdQMDOyA5-mfh5wHSJc9ke'

export default function useRecaptcha() {
  const getToken = (action) => {
    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        // TEMP: enviar token fallback si reCAPTCHA no cargo
        console.warn('[reCAPTCHA] No cargado, usando token fallback')
        resolve('recaptcha_fallback_token')
        return
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action })
          .then(resolve)
          .catch((err) => {
            // TEMP: enviar token fallback si falla la ejecucion
            console.warn('[reCAPTCHA] Error en execute, usando fallback:', err)
            resolve('recaptcha_fallback_token')
          })
      })
    })
  }

  return { getToken }
}
