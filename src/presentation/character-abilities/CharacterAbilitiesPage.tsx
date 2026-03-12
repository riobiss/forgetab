import Link from "next/link"
import type { CharacterAbilitiesViewModel } from "@/application/characterAbilities/types"
import CharacterAbilitiesFeature from "./CharacterAbilitiesFeature"
import styles from "./CharacterAbilitiesPage.module.css"

type CharacterAbilitiesPageProps = {
  data: CharacterAbilitiesViewModel
}

export default function CharacterAbilitiesPage({ data }: CharacterAbilitiesPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Habilidades</p>
          <h1 className={styles.title}>
            <Link
              href={`/rpg/${data.rpgId}/characters/${data.characterId}`}
              className={styles.titleLink}
            >
              {data.characterName}
            </Link>
          </h1>
        </div>
        <div className={styles.badge}>Classe: {data.classLabel}</div>
      </div>

      <section className={styles.section}>
        {data.abilities.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma habilidade comprada para este personagem.</p>
        ) : (
          <CharacterAbilitiesFeature data={data} gatewayFactory="http" />
        )}
      </section>
    </div>
  )
}
