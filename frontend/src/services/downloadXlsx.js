import api from './api'

function filenameFromHeader(disposition, fallback) {
  if (!disposition) return fallback
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  return match ? decodeURIComponent(match[1]) : fallback
}

export default async function downloadXlsx(url, params = {}, fallbackFilename = 'export.xlsx') {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
  const response = await api.get(url, {
    params: cleanParams,
    responseType: 'blob'
  })
  const filename = filenameFromHeader(response.headers['content-disposition'], fallbackFilename)
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
