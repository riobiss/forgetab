import { useCallback, useEffect, useState } from "react"
import type { CustomField } from "./editorState"

export function useItemEditorAssets() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [newCustomFieldName, setNewCustomFieldName] = useState("")
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("")
  const [pendingImageRemoval, setPendingImageRemoval] = useState(false)

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  const resetItemEditorAssets = useCallback(() => {
    setCustomFields([])
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
    setUploadingImage(false)
    setUploadError("")
    setSelectedImageFile(null)
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return ""
    })
    setPendingImageRemoval(false)
  }, [])

  const handleImageUpload = useCallback(
    (file: File, options?: { clearErrors?: () => void }) => {
      setSelectedImagePreviewUrl((previousPreviewUrl) => {
        if (previousPreviewUrl) {
          URL.revokeObjectURL(previousPreviewUrl)
        }
        return URL.createObjectURL(file)
      })

      setSelectedImageFile(file)
      setPendingImageRemoval(false)
      setUploadError("")
      options?.clearErrors?.()
    },
    [],
  )

  const handleRemoveImage = useCallback(
    (currentImage: string, options?: { clearErrors?: () => void }) => {
      setSelectedImagePreviewUrl((previousPreviewUrl) => {
        if (previousPreviewUrl) {
          URL.revokeObjectURL(previousPreviewUrl)
        }
        return ""
      })
      setSelectedImageFile(null)
      setPendingImageRemoval(currentImage.trim().length > 0)
      setUploadError("")
      options?.clearErrors?.()
    },
    [],
  )

  const addCustomField = useCallback(
    (options: {
      onMissingName: () => void
      onAdded?: () => void
    }) => {
      const trimmedName = newCustomFieldName.trim()
      if (!trimmedName) {
        options.onMissingName()
        return
      }

      setCustomFields((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: trimmedName,
          value: newCustomFieldValue,
        },
      ])
      setNewCustomFieldName("")
      setNewCustomFieldValue("")
      setCustomFieldModalOpen(false)
      options.onAdded?.()
    },
    [newCustomFieldName, newCustomFieldValue],
  )

  return {
    customFields,
    setCustomFields,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    uploadingImage,
    setUploadingImage,
    uploadError,
    setUploadError,
    selectedImageFile,
    setSelectedImageFile,
    selectedImagePreviewUrl,
    setSelectedImagePreviewUrl,
    pendingImageRemoval,
    setPendingImageRemoval,
    resetItemEditorAssets,
    handleImageUpload,
    handleRemoveImage,
    addCustomField,
  }
}
