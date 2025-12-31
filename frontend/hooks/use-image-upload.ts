"use client"

import { useState, useCallback } from 'react'

interface UploadResult {
  imageId: string
  imageUrl: string
  dataUrl: string
}

interface UseImageUploadOptions {
  maxSizeMB?: number
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string) => void
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { maxSizeMB = 1, onSuccess, onError } = options
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (
    file: File,
    userId: string,
    chapterId: string,
    schoolId?: string
  ): Promise<UploadResult | null> => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`Image must be less than ${maxSizeMB}MB`)
      }

      setProgress(30)

      // Compress image if needed (for large images)
      let processedFile = file
      if (file.size > 500 * 1024) { // If larger than 500KB, compress
        processedFile = await compressImage(file, 0.8)
        setProgress(50)
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('userId', userId)
      formData.append('chapterId', chapterId)
      if (schoolId) {
        formData.append('schoolId', schoolId)
      }

      setProgress(70)

      // Upload
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setProgress(100)

      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      onError?.(errorMessage)
      return null
    } finally {
      setUploading(false)
    }
  }, [maxSizeMB, onSuccess, onError])

  const uploadFromDataUrl = useCallback(async (
    dataUrl: string,
    fileName: string,
    userId: string,
    chapterId: string,
    schoolId?: string
  ): Promise<UploadResult | null> => {
    // Convert data URL to File
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: blob.type })
    
    return upload(file, userId, chapterId, schoolId)
  }, [upload])

  return {
    upload,
    uploadFromDataUrl,
    uploading,
    progress,
    error,
  }
}

// Helper function to compress images
async function compressImage(file: File, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions (max 1200px on longest side)
      const maxDim = 1200
      let width = img.width
      let height = img.height

      if (width > height && width > maxDim) {
        height = (height * maxDim) / width
        width = maxDim
      } else if (height > maxDim) {
        width = (width * maxDim) / height
        height = maxDim
      }

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Helper to convert file to data URL (for preview)
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
