import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"
import type {
  EntityCatalogAbilityLevel,
  EntityCatalogAbilityView
} from "@/features/world/catalog/application/types"
import styles from "./EntityAbilitiesPanel.module.css"

const CATEGORY_LABELS: Record<string, string> = {
  tecnicas: "Tecnicas",
  arcana: "Arcana",
  espiritual: "Espiritual",
  mental: "Mental",
  natural: "Natural",
  tecnologica: "Tecnologica"
}
const TYPE_LABELS: Record<string, string> = {
  attack: "Ataque",
  burst: "Explosao",
  support: "Suporte",
  buff: "Buff",
  debuff: "Debuff",
  control: "Controle",
  defense: "Defesa",
  mobility: "Mobilidade",
  summon: "Invocacao",
  utility: "Utilidade",
  resource: "Recurso"
}
const ACTION_LABELS: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva"
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function label(value: string | null, labels: Record<string, string>) {
  return value ? (labels[value] ?? value) : null
}

function Stat({
  name,
  value,
  full = false
}: {
  name: string
  value: string | number | null
  full?: boolean
}) {
  if (value === null || value === "") return null
  return (
    <div
      className={
        full ? `${styles.statItem} ${styles.statItemFull}` : styles.statItem
      }
    >
      <strong>{name}</strong>
      {value}
    </div>
  )
}

export default function EntityAbilityStats({
  skill,
  level
}: {
  skill: EntityCatalogAbilityView
  level: EntityCatalogAbilityLevel
}) {
  const category = level.levelCategory ?? skill.skillCategory
  const type = level.levelType ?? skill.skillType
  const action = level.levelActionType ?? skill.skillActionType
  const tags = skill.skillTags
    .map((tag) => getSkillTagMeta(tag)?.label)
    .filter((value): value is string => Boolean(value))
    .join(" | ")

  return (
    <div className={styles.abilityStats}>
      <Stat name="Requisito" value={`Level ${level.levelRequired}`} />
      <Stat
        name="Categoria"
        value={hasText(category) ? label(category, CATEGORY_LABELS) : null}
      />
      <Stat
        name="Tipo"
        value={hasText(type) ? label(type, TYPE_LABELS) : null}
      />
      <Stat
        name="Acao"
        value={hasText(action) ? label(action, ACTION_LABELS) : null}
      />
      <Stat name="Tags" value={tags || null} full />
      <Stat name="Dano" value={hasText(level.damage) ? level.damage : null} />
      <Stat name="Alcance" value={hasText(level.range) ? level.range : null} />
      <Stat
        name="Recarga"
        value={hasText(level.cooldown) ? level.cooldown : null}
      />
      <Stat
        name="Duracao"
        value={hasText(level.duration) ? level.duration : null}
      />
      <Stat
        name="Conjuracao"
        value={hasText(level.castTime) ? level.castTime : null}
      />
      <Stat
        name="Custo de recurso"
        value={hasText(level.resourceCost) ? level.resourceCost : null}
      />
      <Stat
        name="Obs"
        value={level.notesList.length > 0 ? level.notesList.join(" | ") : null}
        full
      />
      <Stat
        name="Custo"
        value={hasText(level.costCustom) ? level.costCustom : null}
      />
      {level.customFields.map((field) => (
        <Stat key={field.id} name={field.name} value={field.value ?? "-"} />
      ))}
    </div>
  )
}
