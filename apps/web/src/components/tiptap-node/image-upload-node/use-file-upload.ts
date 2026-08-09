"use client"

import { useState } from "react"

export type FileItem = {
  id: string
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  url?: string
  abortController?: AbortController
}

export type UploadOptions = {
  maxSize: number
  limit: number
  accept: string
  upload: (
    file: File,
    onProgress: (event: { progress: number }) => void,
    signal: AbortSignal
  ) => Promise<string>
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

function acceptsFile(file: File, accept: string) {
  if (!accept.trim()) return true

  return accept.split(",").some((rawRule) => {
    const rule = rawRule.trim().toLowerCase()
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()

    if (rule.startsWith(".")) return fileName.endsWith(rule)
    if (rule.endsWith("/*")) return fileType.startsWith(rule.slice(0, -1))
    return fileType === rule
  })
}

export function useFileUpload(options: UploadOptions) {
  const [fileItems, setFileItems] = useState<FileItem[]>([])

  async function uploadFile(file: File): Promise<string | null> {
    if (!acceptsFile(file, options.accept)) {
      options.onError?.(new Error(`File type is not allowed: ${file.type}`))
      return null
    }

    if (options.maxSize > 0 && file.size > options.maxSize) {
      options.onError?.(
        new Error(
          `File size exceeds maximum allowed (${options.maxSize / 1024 / 1024}MB)`
        )
      )
      return null
    }

    const abortController = new AbortController()
    const fileId = crypto.randomUUID()

    setFileItems((current) => [
      ...current,
      {
        id: fileId,
        file,
        progress: 0,
        status: "uploading",
        abortController
      }
    ])

    try {
      const url = await options.upload(
        file,
        ({ progress }) => {
          setFileItems((current) =>
            current.map((item) =>
              item.id === fileId ? { ...item, progress } : item
            )
          )
        },
        abortController.signal
      )

      if (!url) throw new Error("Upload failed: No URL returned")
      if (abortController.signal.aborted) return null

      setFileItems((current) =>
        current.map((item) =>
          item.id === fileId
            ? { ...item, status: "success", url, progress: 100 }
            : item
        )
      )
      options.onSuccess?.(url)
      return url
    } catch (error) {
      if (!abortController.signal.aborted) {
        setFileItems((current) =>
          current.map((item) =>
            item.id === fileId
              ? { ...item, status: "error", progress: 0 }
              : item
          )
        )
        options.onError?.(
          error instanceof Error ? error : new Error("Upload failed")
        )
      }
      return null
    }
  }

  async function uploadFiles(files: File[]): Promise<string[]> {
    if (files.length === 0) {
      options.onError?.(new Error("No files to upload"))
      return []
    }

    if (options.limit > 0 && files.length > options.limit) {
      options.onError?.(
        new Error(
          `Maximum ${options.limit} file${options.limit === 1 ? "" : "s"} allowed`
        )
      )
      return []
    }

    const results = await Promise.all(files.map(uploadFile))
    return results.filter((url): url is string => url !== null)
  }

  function removeFileItem(fileId: string) {
    setFileItems((current) => {
      current.find((item) => item.id === fileId)?.abortController?.abort()
      return current.filter((item) => item.id !== fileId)
    })
  }

  function clearAllFiles() {
    fileItems.forEach((item) => item.abortController?.abort())
    setFileItems([])
  }

  return { fileItems, uploadFiles, removeFileItem, clearAllFiles }
}
