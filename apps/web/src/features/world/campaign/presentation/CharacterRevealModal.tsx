import { X } from "lucide-react"
import type { CharacterDetailViewModel } from "@/features/world/characters/application/detail/types"
import {
  CHARACTER_REVEAL_FIELD_LABEL,
  getAvailableRevealFields,
  type CharacterRevealField
} from "./characterRevealActionMapper"
import modalStyles from "./CharacterRevealModal.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type Props = {
  character: CharacterDetailViewModel
  fields: Record<CharacterRevealField, boolean>
  isBusy: boolean
  onClose: () => void
  onSubmit: () => void
  onToggleField: (field: CharacterRevealField) => void
}

export function CharacterRevealModal({
  character,
  fields,
  isBusy,
  onClose,
  onSubmit,
  onToggleField
}: Props) {
  const availableFields = getAvailableRevealFields(character)

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={modalStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-reveal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <div>
            <h2 id="character-reveal-title" className={styles.actionModalTitle}>
              Revelar
            </h2>
            <p className={modalStyles.subtitle}>{character.displayName}</p>
          </div>
          <button
            type="button"
            className={styles.closeChatButton}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <p className={modalStyles.hint}>
          Nome e imagem sempre entram na sala. Escolha o que mais sera exibido.
        </p>

        <div className={modalStyles.checklist}>
          {availableFields.map((field) => (
            <label key={field} className={modalStyles.check}>
              <input
                type="checkbox"
                checked={fields[field]}
                onChange={() => onToggleField(field)}
              />
              <span>{CHARACTER_REVEAL_FIELD_LABEL[field]}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          className={styles.rollSubmitButton}
          onClick={onSubmit}
          disabled={isBusy}
        >
          Revelar na sala
        </button>
      </section>
    </div>
  )
}
