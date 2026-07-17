"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import styles from "../RpgDashboardPage.module.css"

type Props = {
  title: string
  description: string
  masterName: string
  visibility: "private" | "public"
  createdAt: string
  membersCount: number
}

export default function RpgInfoModalButton({
  title,
  description,
  masterName,
  visibility,
  createdAt,
  membersCount,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.infoButton}
        onClick={() => setIsOpen(true)}
        aria-label="Informacoes do RPG"
        title="Informacoes do RPG"
      >
        <Info size={18} />
      </button>

      {isOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Informacoes do RPG"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Informacoes do RPG</h3>
            <div className={styles.infoGrid}>
              <p>
                <strong>Titulo:</strong> {title}
              </p>
              <p>
                <strong>Visibilidade:</strong> {visibility === "public" ? "Publico" : "Privado"}
              </p>
              <p>
                <strong>Mestre:</strong> {masterName}
              </p>
              <p>
                <strong>Criado em:</strong> {createdAt}
              </p>
              <p>
                <strong>Membros:</strong> {membersCount}
              </p>
              <p>
                <strong>Descricao:</strong> {description}
              </p>
            </div>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </button>
          </section>
        </div>
      ) : null}
    </>
  )
}
