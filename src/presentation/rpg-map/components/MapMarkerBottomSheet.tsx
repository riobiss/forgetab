"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import { useEffect, useState, type MouseEvent, type RefObject } from "react"
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react"
import type { MapMarkerItem } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  marker: MapMarkerItem
  canEdit: boolean
  sheetRef: RefObject<HTMLDivElement | null>
  linkedSectionName?: string | null
  onEdit: () => void
  onMoreInfo?: () => void
  onClose: () => void
}

export function MapMarkerBottomSheet({ marker, canEdit, sheetRef, linkedSectionName, onEdit, onMoreInfo, onClose }: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [lightboxHost, setLightboxHost] = useState<HTMLElement | null>(null)
  const [lightboxElement, setLightboxElement] = useState<HTMLElement | null>(null)
  const images =
    marker.displayImages?.filter((image) => image.trim().length > 0) ??
    (marker.image?.trim() ? [marker.image.trim()] : [])
  const activeImage = images[currentImageIndex] ?? null

  useEffect(() => {
    setCurrentImageIndex(0)
    setIsImageViewerOpen(false)
  }, [marker.id])

  useEffect(() => {
    setLightboxHost(document.body)
  }, [])

  useEffect(() => {
    if (!isImageViewerOpen || !lightboxElement) {
      return
    }

    queueMicrotask(() => {
      if (document.fullscreenElement) {
        return
      }

      if (typeof lightboxElement.requestFullscreen === "function") {
        void lightboxElement.requestFullscreen().catch(() => undefined)
      }
    })
  }, [isImageViewerOpen, lightboxElement])

  useEffect(() => {
    if (!isImageViewerOpen) {
      return
    }

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsImageViewerOpen(false)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [isImageViewerOpen])

  function showPreviousImage() {
    if (images.length === 0) return
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length)
  }

  function showNextImage() {
    if (images.length === 0) return
    setCurrentImageIndex((current) => (current + 1) % images.length)
  }

  function handleOpenImageViewer(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsImageViewerOpen(true)
  }

  async function closeImageViewer() {
    try {
      if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
        await document.exitFullscreen()
      }
    } catch {
      // fallback visual
    }

    setIsImageViewerOpen(false)
  }

  const lightbox =
    isImageViewerOpen && activeImage && lightboxHost
      ? createPortal(
          <div
            ref={setLightboxElement}
            className={styles.markerImageLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Imagem do marcador em tela cheia"
          >
            <button
              type="button"
              className={styles.markerImageLightboxClose}
              onClick={() => void closeImageViewer()}
              aria-label="Fechar imagem"
            >
              <X size={18} />
            </button>
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.markerImageLightboxNav} ${styles.markerImageLightboxNavPrev}`}
                onClick={showPreviousImage}
                aria-label="Imagem anterior"
              >
                <ChevronLeft size={20} />
              </button>
            ) : null}
            <div className={styles.markerImageLightboxFrame}>
              <Image
                src={activeImage}
                alt={`Imagem ${currentImageIndex + 1} do marcador`}
                fill
                sizes="100vw"
                unoptimized
              />
            </div>
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.markerImageLightboxNav} ${styles.markerImageLightboxNavNext}`}
                onClick={showNextImage}
                aria-label="Proxima imagem"
              >
                <ChevronRight size={20} />
              </button>
            ) : null}
          </div>,
          lightboxHost,
        )
      : null

  return (
    <>
    <div className={styles.bottomSheetOverlay} role="dialog" aria-modal="true" aria-label="Detalhes do marcador">
      <section ref={sheetRef} className={styles.bottomSheet} tabIndex={-1}>
        <div className={styles.bottomSheetHandle} />
        <div className={styles.bottomSheetHeader}>
          {canEdit ? (
            <button type="button" className={styles.iconButton} onClick={onEdit} aria-label="Editar marcador">
              <Pencil size={16} />
            </button>
          ) : (
            <span />
          )}
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar detalhes do marcador">
            <X size={16} />
          </button>
        </div>

        {activeImage ? (
          <div className={styles.bottomSheetGallery}>
            <button
              type="button"
              className={styles.bottomSheetGalleryButton}
              onClick={handleOpenImageViewer}
              aria-label="Abrir imagem em tela cheia"
            >
              <div className={styles.bottomSheetImageWrap}>
                <Image
                  src={activeImage}
                  alt={marker.name}
                  className={styles.bottomSheetImage}
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  unoptimized
                />
              </div>
            </button>
            {images.length > 1 ? (
              <div className={styles.bottomSheetGalleryIndicators} aria-label="Indicadores da galeria">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`${styles.bottomSheetGalleryIndicator} ${index === currentImageIndex ? styles.bottomSheetGalleryIndicatorActive : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Mostrar imagem ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.bottomSheetContent}>
          <div className={styles.bottomSheetField}>
            <span>Nome</span>
            <strong>{marker.name}</strong>
          </div>
          {marker.type ? (
            <div className={styles.bottomSheetField}>
              <span>Tipo</span>
              <strong>{marker.type}</strong>
            </div>
          ) : null}
          <div className={styles.bottomSheetField}>
            <span>Localizacao</span>
            <strong>{marker.location || "Nao informada"}</strong>
          </div>
          <div className={styles.bottomSheetField}>
            <span>Descricao</span>
            <p>{marker.shortDescription || "Sem descricao."}</p>
          </div>
          {marker.displayFields?.length ? (
            marker.displayFields.map((field) => (
              <div key={field.name} className={styles.bottomSheetField}>
                <span>{field.name}</span>
                <p>{field.value}</p>
              </div>
            ))
          ) : null}
          {onMoreInfo && linkedSectionName ? (
            <div className={styles.bottomSheetActions}>
              <button type="button" className={styles.primaryButton} onClick={onMoreInfo}>
                Mais informacoes
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
    {lightbox}
    </>
  )
}
