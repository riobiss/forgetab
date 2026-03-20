"use client"

import Image from "next/image"
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
            <Image
              src={marker.image.trim()}
              alt={marker.name}
              className={styles.bottomSheetImage}
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized
            />
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
        </div>
      </section>
    </div>
  )
}
