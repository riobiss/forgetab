import styles from "../../CharactersDashboardPage.module.css"
import type {
  NpcMonsterLoadoutItemOptionDto,
  NpcMonsterLoadoutSkillOptionDto,
} from "@/application/npcMonsterLoadout/types"
import type { PickerMode } from "./types"

type Props = {
  mode: PickerMode
  isSaving: boolean
  search: string
  availableItems: NpcMonsterLoadoutItemOptionDto[]
  availableSkills: NpcMonsterLoadoutSkillOptionDto[]
  onClose: () => void
  onSearchChange: (value: string) => void
  onAddItem: (itemId: string) => void
  onAddSkill: (skillId: string) => void
}

export default function NpcMonsterPickerModal({
  mode,
  isSaving,
  search,
  availableItems,
  availableSkills,
  onClose,
  onSearchChange,
  onAddItem,
  onAddSkill,
}: Props) {
  if (!mode) {
    return null
  }

  return (
    <div
      className={styles.nestedModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "inventory" ? "Adicionar item" : "Adicionar habilidade"}
      onClick={() => {
        if (!isSaving) {
          onClose()
        }
      }}
    >
      <section className={styles.nestedModalShell} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.nestedModalTitle}>
          {mode === "inventory" ? "Adicionar item" : "Adicionar habilidade"}
        </h3>
        <label className={styles.modalField}>
          <span>Buscar</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={mode === "inventory" ? "Buscar item" : "Buscar habilidade"}
          />
        </label>
        <div className={styles.modalPickerResults}>
          {mode === "inventory" ? (
            availableItems.length > 0 ? (
              availableItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.modalPickerItem}
                  onClick={() => onAddItem(item.id)}
                  disabled={isSaving}
                >
                  <strong>{item.name}</strong>
                  <span>{[item.type, item.rarity].filter(Boolean).join(" · ") || "Item do RPG"}</span>
                </button>
              ))
            ) : (
              <p className={styles.modalInfo}>Nenhum item encontrado.</p>
            )
          ) : availableSkills.length > 0 ? (
            availableSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={styles.modalPickerItem}
                onClick={() => onAddSkill(skill.id)}
                disabled={isSaving}
              >
                <strong>{skill.slug}</strong>
                <span>{skill.tags.join(" · ") || "Habilidade do RPG"}</span>
              </button>
            ))
          ) : (
            <p className={styles.modalInfo}>Nenhuma habilidade encontrada.</p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalSecondaryButton}
            onClick={onClose}
            disabled={isSaving}
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  )
}
