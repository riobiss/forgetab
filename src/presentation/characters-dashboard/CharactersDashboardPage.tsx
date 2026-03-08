import Image from "next/image"
import Link from "next/link"
import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"
import CharacterCreationPermission from "./components/CharacterCreationPermission"
import styles from "./CharactersDashboardPage.module.css"

type CharactersDashboardPageProps = {
  data: CharactersDashboardViewModel
}

export default function CharactersDashboardPage({ data }: CharactersDashboardPageProps) {
  return (
    <main className={styles.container}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Personagens</h1>

        {data.canCreateCharacter && data.isOwner ? (
          <div className={styles.topActions}>
            <Link href={`/rpg/${data.rpgId}/characters/new`} className={styles.createButton}>
              Criar personagem
            </Link>
          </div>
        ) : null}
      </div>

      <div className={styles.filters}>
        <Link
          href={`/rpg/${data.rpgId}/characters`}
          className={`${styles.filterButton} ${data.filterType === "all" ? styles.filterActive : ""}`}
        >
          Todos
        </Link>
        <Link
          href={`/rpg/${data.rpgId}/characters?type=player`}
          className={`${styles.filterButton} ${data.filterType === "player" ? styles.filterActive : ""}`}
        >
          Player
        </Link>
        <Link
          href={`/rpg/${data.rpgId}/characters?type=npc`}
          className={`${styles.filterButton} ${data.filterType === "npc" ? styles.filterActive : ""}`}
        >
          NPC
        </Link>
        <Link
          href={`/rpg/${data.rpgId}/characters?type=monster`}
          className={`${styles.filterButton} ${data.filterType === "monster" ? styles.filterActive : ""}`}
        >
          Monstro
        </Link>
      </div>

      {data.canCreateCharacter ? (
        <CharacterCreationPermission
          rpgId={data.rpgId}
          isOwner={data.isOwner}
          isAcceptedMember={data.isAcceptedMember}
          ownPlayerCount={data.ownPlayerCount}
          allowMultiplePlayerCharacters={data.allowMultiplePlayerCharacters}
        />
      ) : null}

      {data.characters.length > 0 ? (
        <section className={styles.dbSection}>
          <div className={styles.grid}>
            {data.characters.map((character) => (
              <article key={character.id} className={styles.card}>
                <Link href={`/rpg/${data.rpgId}/characters/${character.id}`}>
                  <Image
                    src={character.image ?? "/images/bg-characters.jpg"}
                    alt={`Imagem do personagem ${character.name}`}
                    fill
                    className={styles.image}
                    priority
                    sizes="(max-width: 1099px) 50vw, 33vw"
                  />
                  <div className={styles.overlay}>
                    <h2 className={styles.name}>{character.name}</h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {data.characters.length === 0 ? (
        <p className={styles.emptyState}>Nenhum personagem encontrado.</p>
      ) : null}
    </main>
  )
}
