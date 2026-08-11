import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import {
  hasText,
  toActionTypeLabel,
  toCategoryLabel,
  toTypeLabel
} from "./abilityPresentation"
import styles from "./CharacterAbilitiesPage.module.css"

type Props = {
  ability: PurchasedAbilityViewDto
  canManage: boolean
  removing: boolean
  removeError: string
  onClose: () => void
  onRemove: () => void
}

export function AbilityDetailsModal({
  ability,
  canManage,
  removing,
  removeError,
  onClose,
  onRemove
}: Props) {
  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes da habilidade"
      onClick={onClose}
    >
      <section
        className={styles.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {ability.levelName ?? ability.skillName}
          </h3>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.detailLabelOrange}>Categoria</span>
          <p className={styles.modalText}>
            {toCategoryLabel(ability.skillCategory) ?? "Nao informado"}
          </p>
        </div>
        <div className={styles.modalSection}>
          <span className={styles.detailLabelOrange}>Tipos</span>
          <p className={styles.modalText}>
            {toTypeLabel(ability.skillType) ?? "Nao informado"} |{" "}
            {toActionTypeLabel(ability.skillActionType) ?? "Nao informado"}
          </p>
        </div>
        <div className={styles.modalSection}>
          <span className={styles.detailLabelOrange}>Requirements</span>
          <p className={styles.modalText}>
            Level requerido: {ability.levelRequired}
          </p>
          {hasText(ability.prerequisite) ? (
            <p className={styles.modalText}>
              Pre-requisito: {ability.prerequisite}
            </p>
          ) : null}
          {ability.allowedClasses.length > 0 ? (
            <p className={styles.modalText}>
              Classes permitidas: {ability.allowedClasses.join(" | ")}
            </p>
          ) : null}
          {ability.allowedRaces.length > 0 ? (
            <p className={styles.modalText}>
              Racas permitidas: {ability.allowedRaces.join(" | ")}
            </p>
          ) : null}
        </div>
        <div className={styles.modalSection}>
          <span className={styles.detailLabelOrange}>Preço</span>
          <p className={styles.modalText}>
            {ability.pointsCost ?? "Nao informado"}
          </p>
          {hasText(ability.costCustom) ? (
            <p className={styles.modalText}>
              Custo extra: {ability.costCustom}
            </p>
          ) : null}
        </div>
        <div className={styles.modalSection}>
          <span className={styles.detailLabelOrange}>Tags</span>
          {ability.skillTags.length > 0 ? (
            <div className={styles.typeChips}>
              {ability.skillTags.map((tag) => (
                <span key={tag} className={styles.typeChip}>
                  {getSkillTagMeta(tag)?.label ?? tag}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.modalText}>Sem tags</p>
          )}
        </div>
        {ability.customFields.length > 0 ? (
          <div className={styles.modalSection}>
            <span className={styles.detailLabelOrange}>Campos adicionais</span>
            {ability.customFields.map((field) => (
              <p key={field.id} className={styles.modalText}>
                {field.name}: {field.value ?? "-"}
              </p>
            ))}
          </div>
        ) : null}
        {canManage ? (
          <>
            {removeError ? (
              <p className={styles.errorText}>{removeError}</p>
            ) : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.removeAbilityButton}
                onClick={onRemove}
                disabled={removing}
              >
                {removing ? "Retirando..." : "Retirar habilidade"}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}
