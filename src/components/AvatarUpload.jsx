import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

export default function AvatarUpload({ currentAvatar, onFileSelect }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentAvatar || null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      onFileSelect(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleChange = (e) => {
    handleFile(e.target.files[0])
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`relative w-32 h-32 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all duration-200 ${
          dragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : preview
              ? 'border-transparent hover:border-blue-400'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Camera size={32} />
            <span className="text-xs mt-1">Upload Photo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">
            {preview ? 'Change' : 'Upload'}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-xs text-gray-500">Click to upload or drag & drop</p>
    </div>
  )
}
