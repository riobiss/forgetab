"use client"

import type { RefObject } from "react"
import { Pencil, X } from "lucide-react"
import type { MapMarkerItem } from "@/presentation/rpg-map/types/mapMarkers"
import styles from "../WorldMap.module.css"

type Props = {
  marker: MapMarkerItem
  canEdit: boolean
  sheetRef: RefObject<HTMLDivElement | null>
  onEdit: () => void
  onClose: () => void
}

export function MapMarkerBottomSheet({ marker, canEdit, sheetRef, onEdit, onClose }: Props) {
  return (
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

        {marker.image ? (
          <div className={styles.bottomSheetImageWrap}>
            <img
              src={marker.image.trim()}
              alt={marker.name}
              className={styles.bottomSheetImage}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}

        <div className={styles.bottomSheetContent}>
          <div className={styles.bottomSheetField}>
            <span>Nome</span>
            <strong>{marker.name}</strong>
          </div>
          <div className={styles.bottomSheetField}>
            <span>Localizacao</span>
            <strong>{marker.location || "Nao informada"}</strong>
          </div>
          <div className={styles.bottomSheetField}>
            <span>Descricao</span>
            <p>{marker.shortDescription || "Sem descricao."}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
