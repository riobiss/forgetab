import Image from "next/image"
import Link from "next/link"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import StatusTracker from "./StatusTracker"
import styles from "./CharacterDetailPage.module.css"

type CharacterDetailPageProps = {
  data: CharacterDetailViewModel
}

export default function CharacterDetailPage({ data }: CharacterDetailPageProps) {
  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div className={styles.titleBar}>
          <div className={styles.titleInfo}>
            <h3>{data.displayName}</h3>
            {data.characterType === "player" ? (
              <p className={styles.pointsLabel}>
                {data.costResourceName}: {data.skillPoints}
              </p>
            ) : null}
          </div>
          <div className={styles.titleActions}>
            <Link className={styles.editInlineButton} href={`/rpg/${data.rpgId}/characters`}>
              Voltar
            </Link>
            {data.canEditCharacter ? (
              <Link
                className={styles.editInlineButton}
                href={`/rpg/${data.rpgId}/characters/new?characterId=${data.characterId}`}
              >
                Editar
              </Link>
            ) : null}
          </div>
        </div>
        <div className={styles.header}>
          <div className={styles.imageColumn}>
            <Image
              src={data.image ?? "/images/bg-characters.jpg"}
              alt={data.displayName}
              width={150}
              height={192}
              priority
            />
          </div>
          <div className={styles.identityInfo}>
            <div className={styles.actionLinks}>
              <Link
                className={`${styles.actionLink} ${styles.imageActionLink}`}
                href={`/rpg/${data.rpgId}/characters/${data.characterId}/inventory`}
              >
                Inventario
              </Link>
              <Link
                className={styles.actionLink}
                href={`/rpg/${data.rpgId}/characters/${data.characterId}/abilities`}
              >
                Habilidades
              </Link>
            </div>

            <p className={styles.kingdom}>
              Tipo:{" "}
              {data.characterType === "player"
                ? "Player"
                : data.characterType === "npc"
                  ? "NPC"
                  : "Monstro"}
            </p>
          </div>
        </div>

        {data.statusEntries.length > 0 ? (
          <div className={styles.grid}>
            <div>
              <h4>Status</h4>
              <StatusTracker
                items={data.statusEntries}
                rpgId={data.rpgId}
                characterId={data.characterId}
                canPersist={data.canEditCharacter}
              />
            </div>
          </div>
        ) : null}

        {data.attributeEntries.length > 0 || data.skillEntries.length > 0 ? (
          <div className={styles.containerSkillAttributes}>
            {data.attributeEntries.length > 0 ? (
              <div>
                <h4>Atributos</h4>
                <ul className={styles.list}>
                  {data.attributeEntries.map((item) => (
                    <li key={item.key}>
                      {item.label}: {item.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data.skillEntries.length > 0 ? (
              <div>
                <h4>Pericias</h4>
                <ul className={styles.list}>
                  {data.skillEntries.map((item) => (
                    <li key={item.key}>
                      {item.label}: {item.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.grid}>
          <div>
            <h4>Progressao</h4>
            <p>Level: {data.progressionLevelDisplay}</p>
            <p>XP: {data.progressionCurrent}</p>
            {data.usersCanManageOwnXp ? <p>Proximo level: {data.nextProgressionTierText}</p> : null}
          </div>

          {data.identityItems.length > 0 ? (
            <div>
              <h4>Identidade</h4>
              {data.identityItems.map((item) => (
                <p key={item.key}>
                  {item.label}:{" "}
                  {item.href ? (
                    <Link className={styles.identityLink} href={item.href}>
                      {item.value.trim() || "-"}
                    </Link>
                  ) : (
                    item.value.trim() || "-"
                  )}
                </p>
              ))}
            </div>
          ) : null}

          {data.characteristicsItems.length > 0 ? (
            <div>
              <h4>Caracteristicas</h4>
              {data.characteristicsItems.map((item) => (
                <p key={item.key}>
                  {item.label}: {item.value.trim() || "-"}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.actionLinks}>
          <Link className={styles.actionLink} href={`/rpg/${data.rpgId}/characters`}>
            Voltar para personagens
          </Link>
        </div>
      </section>
    </div>
  )
}
