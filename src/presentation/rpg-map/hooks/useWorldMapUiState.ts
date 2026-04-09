"use client"

import { useEffect, useState, type MutableRefObject } from "react"
import type { WorldMapCanvasHandle } from "@/presentation/rpg-map/components/WorldMapCanvas"

type Params = {
  frameRef: MutableRefObject<HTMLDivElement | null>
  canvasRef: MutableRefObject<WorldMapCanvasHandle | null>
  canEditContent: boolean
}

const DEFAULT_BRUSH_COLORS = ["#c4243b", "#ff7a18", "#f5e6c8", "#4f9cff", "#34c759"]

export function useWorldMapUiState({ frameRef, canvasRef, canEditContent }: Params) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBrushMode, setIsBrushMode] = useState(false)
  const [isInteractive, setIsInteractive] = useState(false)
  const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_COLORS[0]!)
  const [brushSize, setBrushSize] = useState(4)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    if (!canEditContent) {
      setIsEditOpen(false)
    }
  }, [canEditContent])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const frame = frameRef.current
      const nextIsFullscreen = Boolean(frame && document.fullscreenElement === frame)
      setIsFullscreen(nextIsFullscreen)

      if (!nextIsFullscreen) {
        setIsInteractive(false)
        setIsBrushMode(false)
        return
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          canvasRef.current?.syncToContainer()
        })
      })
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [canvasRef, frameRef])

  function handleEnableInteraction() {
    if (isFullscreen && !isInteractive) {
      setIsInteractive(true)
    }
  }

  async function toggleFullscreen() {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    if (document.fullscreenElement === frame) {
      await document.exitFullscreen()
      setIsBrushMode(false)
      return
    }

    await frame.requestFullscreen()
  }

  function resetView() {
    canvasRef.current?.resetView()
  }

  function toggleBrushMode() {
    if (!isInteractive) {
      return
    }

    setIsBrushMode((prev) => !prev)
  }

  function clearLastDrawing() {
    canvasRef.current?.clearLastDrawing()
  }

  return {
    brushColor,
    brushSize,
    isBrushMode,
    isEditOpen,
    isFullscreen,
    isInteractive,
    setBrushColor,
    setBrushSize,
    setIsEditOpen,
    setIsInteractive,
    toggleBrushMode,
    toggleFullscreen,
    handleEnableInteraction,
    resetView,
    clearLastDrawing,
  }
}

export { DEFAULT_BRUSH_COLORS }
