import { useState } from "react"
import { Button } from "@/components/button"
import { Ability } from "@/types/Ability"
import styles from "./AbilityView.module.css"

type Props = {
  abilities: Ability[]
  onConfirm: (ability: Ability) => void
}

export default function AbilityView({ abilities, onConfirm }: Props) {
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null)

  if (abilities.length === 0) {
    return <p className={styles.empty}>Esse personagem nao possui habilidades.</p>
  }

  return (
    <div className={styles.abilityGrid}>
      {abilities.map((ability) => {
        const isSelected = selectedAbility?.id === ability.id

        return (
          <div
            key={ability.id}
            className={`${styles.abilityCard} ${isSelected ? styles.selected : ""}`}
            onClick={() => setSelectedAbility(ability)}
          >
            <div className={styles.header}>
              <span className={styles.name}>{ability.name}</span>
              <span className={styles.type}>{ability.type}</span>
            </div>

            <p className={styles.description}>{ability.description}</p>

            <div className={styles.stats}>
              <div>
                <label>Dano</label>
                <span>{ability.damage || "N/A"}</span>
              </div>

              <div>
                <label>Alcance</label>
                <span>{ability.range || "Pessoal"}</span>
              </div>

              <div>
                <label>Custo</label>
                <span>
                  {ability.cost?.exhaustion
                    ? `${ability.cost.exhaustion} EX`
                    : ability.cost?.mana
                      ? `${ability.cost.mana} MP`
                      : "0"}
                </span>
              </div>
            </div>

            {isSelected && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onConfirm(ability)
                }}
              >
                Confirmar habilidade
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
