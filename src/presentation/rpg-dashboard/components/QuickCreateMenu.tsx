"use client"

import Link from "next/link"
import {
  Backpack,
  BookOpen,
  Minus,
  PackagePlus,
  Plus,
  PlusCircle,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react"
import styles from "../RpgDashboardPage.module.css"
import { createRpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import { useQuickCreateMenu } from "@/presentation/rpg-dashboard/hooks/useQuickCreateMenu"

type Props = {
  rpgId: string
}

const dashboardDeps = createRpgDashboardDependencies()

export default function QuickCreateMenu({ rpgId }: Props) {
  const {
    isOpen,
    setIsOpen,
    showPointsPanel,
    setShowPointsPanel,
    loadingPanel,
    panelError,
    panelMessage,
    costResourceName,
    amountInput,
    setAmountInput,
    players,
    loadingActionKey,
    hasPlayers,
    selectedAmount,
    wrapperRef,
    loadPointsPanelData,
    handleGrantPoint,
  } = useQuickCreateMenu(dashboardDeps, { rpgId })

  return (
    <div ref={wrapperRef} className={styles.quickCreateWrapper}>
      <button
        type="button"
        className={styles.quickCreateTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Criar novo"
        title="Criar novo"
      >
        <PlusCircle size={16} />
      </button>

      {isOpen ? (
        <div className={styles.quickCreateMenu}>
          <Link href={`/rpg/${rpgId}/characters/new`} onClick={() => setIsOpen(false)}>
            <UserPlus size={15} />
            Criar Personagem
          </Link>
          <Link href={`/rpg/${rpgId}/edit`} onClick={() => setIsOpen(false)}>
            <Users size={15} />
            Criar Raca
          </Link>
          <Link href={`/rpg/${rpgId}/skills`} onClick={() => setIsOpen(false)}>
            <Sparkles size={15} />
            Criar Habilidade
          </Link>
          <Link href={`/rpg/${rpgId}/items/new`} onClick={() => setIsOpen(false)}>
            <PackagePlus size={15} />
            Criar Item
          </Link>
          <Link href={`/rpg/${rpgId}/library`} onClick={() => setIsOpen(false)}>
            <BookOpen size={15} />
            Biblioteca
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !showPointsPanel
              setShowPointsPanel(next)
              if (next) {
                void loadPointsPanelData()
              }
            }}
          >
            <Backpack size={15} />
            {showPointsPanel ? "Ocultar distribuicao de pontos" : "Distribuir pontos de classe"}
          </button>

          {showPointsPanel ? (
            <div className={styles.quickCreatePointsPanel}>
              <Link href={`/rpg/${rpgId}/items`} onClick={() => setIsOpen(false)}>
                <Backpack size={15} />
                Itens
              </Link>
              <p className={styles.quickCreatePanelTitle}>
                Players e classes para distribuir {costResourceName}
              </p>
              <label className={styles.quickCreateAmountField}>
                <span>Quantidade</span>
                <input
                  type="number"
                  onWheel={(event) => event.currentTarget.blur()}
                  min={1}
                  step={1}
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  disabled={loadingActionKey.length > 0}
                />
              </label>

              {loadingPanel ? <p>Carregando players...</p> : null}
              {!loadingPanel && !hasPlayers ? <p>Nenhum player encontrado.</p> : null}

              {players.map((player) => {
                const loadingAdd = loadingActionKey === `${player.id}:1`
                const loadingRemove = loadingActionKey === `${player.id}:-1`
                const loadingAny = loadingActionKey.length > 0
                return (
                  <div key={player.id} className={styles.quickCreatePlayerRow}>
                    <div>
                      <strong>{player.name}</strong>
                      <small>Classe: {player.classLabel}</small>
                    </div>
                    <div className={styles.quickCreateGrantActions}>
                      <button
                        type="button"
                        className={styles.quickCreateGrantButton}
                        onClick={() => void handleGrantPoint(player.id, player.name, -1)}
                        disabled={loadingAny || !selectedAmount}
                        aria-label={`Diminuir ponto de ${player.name}`}
                        title={`Diminuir ponto de ${player.name}`}
                      >
                        {loadingRemove ? "..." : <Minus size={14} />}
                      </button>
                      <button
                        type="button"
                        className={styles.quickCreateGrantButton}
                        onClick={() => void handleGrantPoint(player.id, player.name, 1)}
                        disabled={loadingAny || !selectedAmount}
                        aria-label={`Adicionar ponto para ${player.name}`}
                        title={`Adicionar ponto para ${player.name}`}
                      >
                        {loadingAdd ? "..." : <Plus size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })}

              {panelError ? <p className={styles.quickCreateError}>{panelError}</p> : null}
              {panelMessage ? <p className={styles.quickCreateSuccess}>{panelMessage}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
