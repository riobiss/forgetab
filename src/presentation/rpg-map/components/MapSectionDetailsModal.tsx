"use client"

import { Pencil, X } from "lucide-react"
import type { RefObject } from "react"
import type { RpgMapBreadcrumbDto, RpgMapSectionDto } from "@/application/rpgMap/types"
import styles from "../RpgMapPage.module.css"

type SectionRenderState = {
  name: string
  description: string | null
  type: string | null
  customFields: Array<[string, unknown]>
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
  if (!isOpen || !selectedSection) {
    return null
  }

  return (
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
            <div className={styles.jsonBlock}>
              <strong>Campos</strong>
              <dl className={styles.customFieldList}>
                {sectionRenderState.customFields.map(([name, value]) => (
                  <div key={name} className={styles.customFieldItem}>
                    <dt>{name}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
