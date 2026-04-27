import Image from "next/image"
import Link from "next/link"
import type { CharacterEditorSummaryDto } from "@/application/characters/editor"
import {
  buildCreatureRowsFromCharacter,
  groupCreatureIdentity,
  type CreatureTemplateCategoryDto,
} from "@/application/creatures"
import styles from "./CreaturePages.module.css"

type Props = {
  rpgId: string
  creature: CharacterEditorSummaryDto
  categories: CreatureTemplateCategoryDto[]
}

export default function CreatureDetailPage({ rpgId, creature, categories }: Props) {
  const groups = groupCreatureIdentity(buildCreatureRowsFromCharacter(creature), categories)

  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.titleBlock}>
          <p>Criatura</p>
          <h1>{creature.name}</h1>
        </div>
        <div className={styles.actions}>
          <Link href={`/rpg/${rpgId}/creatures/${creature.id}/edit`} className={styles.button}>
            Editar
          </Link>
          <Link href={`/rpg/${rpgId}/creatures`} className={styles.secondaryButton}>
            Voltar
          </Link>
        </div>
      </div>

      <section className={styles.detailGrid}>
        <article className={styles.detailCard}>
          <h3>Identificacao</h3>
          {creature.image ? (
            <Image src={creature.image} alt={creature.name} width={320} height={400} className={styles.detailImage} />
          ) : null}
          <p><strong>Nome:</strong> {creature.name}</p>
          <p><strong>Visibilidade:</strong> {creature.visibility}</p>
        </article>

        {groups.map((group) => (
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
