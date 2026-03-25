"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { CustomFieldType } from "@/components/custom-fields/typedCustomField"
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react"
import type { RefObject } from "react"
import type { RpgMapBreadcrumbDto, RpgMapSectionDto } from "@/application/rpgMap/types"
import styles from "../RpgMapPage.module.css"

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

type SectionRenderState = {
  name: string
  description: string | null
  type: string | null
  images: string[]
  customFields: Array<readonly [string, { value: string; type: CustomFieldType }]>
}

type Props = {
  isOpen: boolean
  modalRef: RefObject<HTMLElement | null>
  selectedSection: RpgMapSectionDto | null
  breadcrumbs: RpgMapBreadcrumbDto[]
  sectionRenderState: SectionRenderState | null
  onOpenBreadcrumb: (sectionId: string) => void
  onEdit: (section: RpgMapSectionDto) => void
  onClose: () => void
}

export function MapSectionDetailsModal({
  isOpen,
  modalRef,
  selectedSection,
  breadcrumbs,
  sectionRenderState,
  onOpenBreadcrumb,
  onEdit,
  onClose,
}: Props) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [lightboxHost, setLightboxHost] = useState<HTMLElement | null>(null)
  const [lightboxElement, setLightboxElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setCurrentImageIndex(0)
    setIsImageViewerOpen(false)
  }, [selectedSection?.id])

  useEffect(() => {
    setLightboxHost(document.body)
  }, [])

  useEffect(() => {
    if (!isImageViewerOpen || !lightboxElement) {
      return
    }

    const fullscreenDocument = document as FullscreenDocument
    const target = lightboxElement as FullscreenElement

    queueMicrotask(() => {
      if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) {
        return
      }

      try {
        if (typeof target.requestFullscreen === "function") {
          void target.requestFullscreen().catch(() => undefined)
          return
        }

        if (typeof target.webkitRequestFullscreen === "function") {
          void Promise.resolve(target.webkitRequestFullscreen()).catch(() => undefined)
        }
      } catch {
        // Fallback: permanece no lightbox visual normal.
      }
    })
  }, [isImageViewerOpen, lightboxElement])

  useEffect(() => {
    if (!isImageViewerOpen) {
      return
    }

    function handleFullscreenChange() {
      const fullscreenDocument = document as FullscreenDocument
      if (!document.fullscreenElement && !fullscreenDocument.webkitFullscreenElement) {
        setIsImageViewerOpen(false)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange as EventListener)
    }
  }, [isImageViewerOpen])

  if (!isOpen || !selectedSection) {
    return null
  }

  const images = sectionRenderState?.images ?? []
  const activeImage = images[currentImageIndex] ?? null

  function showPreviousImage() {
    if (images.length === 0) return
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length)
  }

  function showNextImage() {
    if (images.length === 0) return
    setCurrentImageIndex((current) => (current + 1) % images.length)
  }

  async function closeImageViewer() {
    const fullscreenDocument = document as FullscreenDocument

    try {
      if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
        await document.exitFullscreen()
      } else if (fullscreenDocument.webkitFullscreenElement && typeof fullscreenDocument.webkitExitFullscreen === "function") {
        await Promise.resolve(fullscreenDocument.webkitExitFullscreen())
      }
    } catch {
      // Fallback: apenas fecha o overlay.
    }

    setIsImageViewerOpen(false)
  }

  function renderFieldValue(value: { value: string; type: CustomFieldType }) {
    if (value.type === "link") {
      return (
        <a
          href={value.value}
          target="_blank"
          rel="noreferrer"
          className={styles.detailFieldLink}
        >
          {value.value}
        </a>
      )
    }

    return <p>{value.value}</p>
  }

  const lightbox =
    isImageViewerOpen && activeImage && lightboxHost
      ? createPortal(
          <div
            ref={setLightboxElement}
            className={styles.sectionImageLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Imagem da secao em tela cheia"
          >
            <button
              type="button"
              className={styles.sectionImageLightboxClose}
              onClick={() => void closeImageViewer()}
              aria-label="Fechar imagem"
            >
              <X size={18} />
            </button>
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.sectionImageLightboxNav} ${styles.sectionImageLightboxNavPrev}`}
                onClick={showPreviousImage}
                aria-label="Imagem anterior"
              >
                <ChevronLeft size={20} />
              </button>
            ) : null}
            <div className={styles.sectionImageLightboxFrame}>
              <Image
                src={activeImage}
                alt={`Imagem da secao ${currentImageIndex + 1}`}
                fill
                sizes="100vw"
                unoptimized
              />
            </div>
            {images.length > 1 ? (
              <button
                type="button"
                className={`${styles.sectionImageLightboxNav} ${styles.sectionImageLightboxNavNext}`}
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
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Detalhes da secao">
      <section ref={modalRef} className={`${styles.modal} ${styles.sectionDetailsModal}`} tabIndex={-1}>
        <div className={styles.panelHeader}>
          <h3>Detalhes da secao</h3>
          <div className={styles.inlineActions}>
            {selectedSection.canEdit ? (
              <button type="button" className={styles.iconButton} onClick={() => onEdit(selectedSection)}>
                <Pencil size={14} />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Fechar detalhes da secao"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {breadcrumbs.length > 0 ? (
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb) => (
              <button key={crumb.id} type="button" onClick={() => onOpenBreadcrumb(crumb.id)}>
                {crumb.label}
              </button>
            ))}
          </nav>
        ) : null}

        <div className={styles.detailCard}>
          {activeImage ? (
            <div className={styles.sectionGallery}>
              <button
                type="button"
                className={styles.sectionGalleryImageButton}
                onClick={() => setIsImageViewerOpen(true)}
                aria-label="Abrir imagem em tela cheia"
              >
                <div className={styles.sectionGalleryImageFrame}>
                  <Image
                    src={activeImage}
                    alt={`Imagem da secao ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    unoptimized
                  />
                </div>
              </button>
              {images.length > 1 ? (
                <div className={styles.sectionGalleryIndicators} aria-label="Indicadores da galeria">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`${styles.sectionGalleryIndicator} ${index === currentImageIndex ? styles.sectionGalleryIndicatorActive : ""}`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Mostrar imagem ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <h4>{sectionRenderState?.name ?? selectedSection.name}</h4>
          {sectionRenderState?.description ? (
            <div className={styles.detailFieldBlock}>
              <strong>Descricao</strong>
              <p>{sectionRenderState.description}</p>
            </div>
          ) : null}
          {sectionRenderState?.type ? (
            <div className={styles.detailFieldBlock}>
              <strong>Tipo</strong>
              <p>{sectionRenderState.type}</p>
            </div>
          ) : null}
          {sectionRenderState && sectionRenderState.customFields.length > 0 ? (
            sectionRenderState.customFields.map(([name, value]) => (
              <div key={name} className={styles.detailFieldBlock}>
                <strong>{name}</strong>
                {renderFieldValue(value)}
              </div>
            ))
          ) : null}
        </div>
      </section>
    </div>
    {lightbox}
    </>
  )
}
