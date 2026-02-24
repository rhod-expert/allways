import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageDropzone({
  label,
  required = false,
  error,
  onFileSelect,
  accept = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
  maxSize = 5 * 1024 * 1024,
}) {
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        onFileSelect(null, 'La imagen no puede superar los 5MB')
      } else {
        onFileSelect(null, 'Solo se aceptan imagenes JPG o PNG')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setFileName(file.name)
      const url = URL.createObjectURL(file)
      setPreview(url)
      onFileSelect(file, null)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  const removeFile = (e) => {
    e.stopPropagation()
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
    onFileSelect(null, null)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-allways-blue bg-blue-50'
            : error
              ? 'border-red-400 bg-red-50/50'
              : 'border-gray-300 bg-gray-50 hover:border-allways-blue hover:bg-blue-50/50'
          }`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Vista previa"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            <p className="text-sm text-gray-500 mt-2 truncate">{fileName}</p>
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="py-4">
            {isDragActive ? (
              <>
                <ImageIcon size={40} className="mx-auto text-allways-blue mb-2" />
                <p className="text-allways-blue font-semibold">Soltar imagen aqui</p>
              </>
            ) : (
              <>
                <Upload size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">
                  Arrastra una imagen o <span className="text-allways-blue font-semibold">hace clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG o PNG, maximo 5MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}
