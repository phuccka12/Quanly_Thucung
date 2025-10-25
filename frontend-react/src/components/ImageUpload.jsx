import React, { useState, useRef } from 'react'
import { API_BASE_URL, BASE_URL } from '../api'

export default function ImageUpload({ value, onChange, className = '' }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn. Vui lòng chọn file dưới 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      const imageUrl = result.url

      setPreview(imageUrl)
      onChange(imageUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload ảnh thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Ảnh
      </label>

      {preview && (
        <div className="relative inline-block">
          <img
            src={preview.startsWith('http') ? preview : `${BASE_URL}${preview}`}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            title="Xóa ảnh"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            uploading
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {uploading ? 'Đang upload...' : 'Chọn ảnh'}
        </label>
        {preview && (
          <span className="text-sm text-gray-500">
            Ảnh đã được chọn
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Chấp nhận: JPG, PNG, GIF. Kích thước tối đa: 5MB
      </p>
    </div>
  )
}