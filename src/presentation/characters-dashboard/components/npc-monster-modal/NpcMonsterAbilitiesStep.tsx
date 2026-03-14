"use client"

import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import styles from "../../CharactersDashboardPage.module.css"

type Props = {
  characterId: string | null
  abilities: PurchasedAbilityViewDto[]
  abilitiesLoading: boolean
  abilitiesError: string
  skillsLoading: boolean
  removingAbilityKey: string | null
  onOpenPicker: () => void
  onRemoveAbility: (skillId: string, level: number) => void
  onClose: () => void
}

export default function NpcMonsterAbilitiesStep({
  characterId,
  abilities,
  abilitiesLoading,
  abilitiesError,
  skillsLoading,
  removingAbilityKey,
  onOpenPicker,
  onRemoveAbility,
  onClose,
}: Props) {
  return (
    <div className={styles.modalBody}>
      <div className={styles.modalSectionHeader}>
        <h3>Habilidades</h3>
        <button
          type="button"
          className={styles.modalPrimaryButton}
          onClick={onOpenPicker}
          disabled={!characterId || skillsLoading}
        >
          {skillsLoading ? "Carregando..." : "Adicionar habilidade"}
        </button>
      </div>
      {abilitiesLoading ? <p className={styles.modalInfo}>Carregando habilidades...</p> : null}
      {abilitiesError ? <p className={styles.modalError}>{abilitiesError}</p> : null}
      {!abilitiesLoading ? (
        abilities.length > 0 ? (
          <div className={styles.modalList}>
            {abilities.map((ability) => (
              <div key={`${ability.skillId}:${ability.levelNumber}`} className={styles.modalListCard}>
                <div>
                  <strong>{ability.levelName ?? ability.skillName}</strong>
                  <p className={styles.modalHint}>Level {ability.levelNumber}</p>
                </div>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => onRemoveAbility(ability.skillId, ability.levelNumber)}
                  disabled={!characterId || removingAbilityKey === `${ability.skillId}:${ability.levelNumber}`}
                >
                  {removingAbilityKey === `${ability.skillId}:${ability.levelNumber}`
                    ? "Removendo..."
                    : "Remover"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.modalInfo}>Nenhuma habilidade neste personagem.</p>
        )
      ) : null}
      <div className={styles.modalFooter}>
        <button type="button" className={styles.modalPrimaryButton} onClick={onClose}>
          Concluir
        </button>
      </div>
    </div>
  )
}
