import Image from "next/image"
import Link from "next/link"
import type { CharacterEditorSummaryDto } from "@/application/characters/editor"
import {
  buildCreatureRowsFromCharacter,
  getCreatureIdentityVisibilityKey,
  groupCreatureIdentity,
  readCreatureSecretVisibility,
  type CreatureTemplateCategoryDto,
} from "@/application/creatures"
import styles from "./CreaturePages.module.css"

type Props = {
  rpgId: string
  creature: CharacterEditorSummaryDto
  categories: CreatureTemplateCategoryDto[]
  canManage: boolean
}

function getCreatureDescription(creature: CharacterEditorSummaryDto) {
  return (
    creature.characteristics?.descricao?.trim() ||
    creature.characteristics?.["descricao-curta"]?.trim() ||
    creature.characteristics?.description?.trim() ||
    ""
  )
}

export default function CreatureDetailPage({ rpgId, creature, categories, canManage }: Props) {
  const groups = groupCreatureIdentity(buildCreatureRowsFromCharacter(creature), categories)
  const description = getCreatureDescription(creature)
  const secretVisibility = readCreatureSecretVisibility(creature.characteristics)

  function canShow(fieldKey: "name" | "image" | "description" | "visibility" | `identity:${string}`) {
    if (canManage || fieldKey === "name") {
      return true
    }

    if (!secretVisibility.configured) {
      return false
    }

    return !secretVisibility.keys.has(fieldKey)
  }

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canShow(getCreatureIdentityVisibilityKey(group.categoryKey, item.key)),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.titleBlock}>
          <p>Criatura</p>
          <h1>{creature.name}</h1>
        </div>
        <div className={styles.actions}>
          {canManage ? (
            <Link href={`/rpg/${rpgId}/creatures/${creature.id}/edit`} className={styles.button}>
              Editar
            </Link>
          ) : null}
          <Link href={canManage ? `/rpg/${rpgId}/creatures` : `/rpg/${rpgId}`} className={styles.secondaryButton}>
            Voltar
          </Link>
        </div>
      </div>

      <section className={styles.detailGrid}>
        <article className={styles.detailCard}>
          <h3>Identificacao</h3>
          {creature.image && canShow("image") ? (
            <Image src={creature.image} alt={creature.name} width={320} height={400} className={styles.detailImage} />
          ) : null}
          <p><strong>Nome:</strong> {creature.name}</p>
          {description && canShow("description") ? <p><strong>Descricao:</strong> {description}</p> : null}
          {canShow("visibility") ? <p><strong>Visibilidade:</strong> {creature.visibility}</p> : null}
        </article>

        {visibleGroups.map((group) => (
          <article key={group.categoryKey} className={styles.detailCard}>
            <h3>{group.categoryLabel}</h3>
            <ul className={styles.detailList}>
              {group.items.map((item) => (
                <li key={`${group.categoryKey}-${item.key}`}>
                  <strong>{item.label}:</strong> {item.value}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  )
}
