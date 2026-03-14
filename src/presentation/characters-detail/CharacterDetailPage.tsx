import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import StatusTracker from "./StatusTracker"
import styles from "./CharacterDetailPage.module.css"

type CharacterDetailTab = {
  key: string
  label: string
}

type CharacterDetailPageProps = {
  data: CharacterDetailViewModel
  presentation?: "page" | "modal"
  onClose?: () => void
  onEdit?: () => void
  tabs?: CharacterDetailTab[]
  activeTab?: string
  onTabChange?: (tabKey: string) => void
  tabContent?: ReactNode
  aboutTabKey?: string
}

const EGYPTIAN_ALPHABET = ["𓀀", "𓀁", "𓀂", "𓀃", "𓀄", "𓀅", "𓀆", "𓀇"]

function renderMaskedText(length = 6) {
  return Array.from(
    { length },
    () => EGYPTIAN_ALPHABET[Math.floor(Math.random() * EGYPTIAN_ALPHABET.length)],
  ).join("")
}

function renderMaskedRows(count = 3) {
  return Array.from({ length: Math.max(2, count) }, (_, index) => (
    <li key={`masked-${index}`}>
      {renderMaskedText(6)}: {renderMaskedText(4)}
    </li>
  ))
}

export default function CharacterDetailPage({
  data,
  presentation = "page",
  onClose,
  onEdit,
  tabs,
  activeTab = "about",
  onTabChange,
  tabContent = null,
  aboutTabKey = "about",
}: CharacterDetailPageProps) {
  const isModal = presentation === "modal"
  const showAboutTab = !tabs?.length || activeTab === aboutTabKey

  return (
    <div className={isModal ? styles.modalPage : styles.page}>
      <section className={isModal ? `${styles.card} ${styles.modalCard}` : styles.card}>
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
            {!isModal ? (
              <Link className={styles.editInlineButton} href={`/rpg/${data.rpgId}/characters`}>
                Voltar
              </Link>
            ) : null}
            {data.canEditCharacter ? (
              data.characterType === "player" ? (
                <Link
                  className={styles.editInlineButton}
                  href={`/rpg/${data.rpgId}/characters?modal=edit&editor=player&characterId=${data.characterId}`}
                >
                  Editar
                </Link>
              ) : onEdit ? (
                <button type="button" className={styles.editInlineButton} onClick={onEdit}>
                  Editar
                </button>
              ) : null
            ) : null}
            {isModal && onClose ? (
              <button
                type="button"
                className={styles.iconCloseButton}
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>
        </div>
        {tabs?.length ? (
          <div className={styles.tabRow}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? `${styles.tabButton} ${styles.tabButtonActive}` : styles.tabButton}
                onClick={() => onTabChange?.(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {showAboutTab ? (
          <>
            <div className={styles.header}>
              <div className={styles.imageColumn}>
                {data.image ? (
                  <Image
                    src={data.image}
                    alt={data.displayName}
                    width={150}
                    height={192}
                    priority
                  />
                ) : null}
              </div>
              <div className={styles.identityInfo}>
                {data.characterType === "player" ? (
                  <div className={styles.actionLinks}>
                    <Link
                      className={`${styles.actionLink} ${styles.imageActionLink}`}
                      href={`/rpg/${data.rpgId}/characters/${data.characterId}/items`}
                    >
                      Inventario
                    </Link>
                    <Link
                      className={styles.actionLink}
                      href={`/rpg/${data.rpgId}/characters/${data.characterId}/skills`}
                    >
                      Habilidades
                    </Link>
                  </div>
                ) : null}
                <p className={styles.kingdom}>
                  Tipo:{" "}
                  {data.characterType === "player"
                    ? "Player"
                    : data.characterType === "npc"
                      ? "NPC"
                      : "Criatura"}
                </p>
              </div>
            </div>

            {data.statusEntries.length > 0 ? (
              <div className={styles.grid}>
                <div>
                  <h4>Status</h4>
                  {data.maskStatuses ? (
                    <ul className={styles.list}>{renderMaskedRows(data.statusEntries.length || 4)}</ul>
                  ) : (
                    <StatusTracker
                      items={data.statusEntries}
                      rpgId={data.rpgId}
                      characterId={data.characterId}
                      canPersist={data.canEditCharacter}
                    />
                  )}
                </div>
              </div>
            ) : null}

            {data.attributeEntries.length > 0 || data.skillEntries.length > 0 ? (
              <div className={styles.containerSkillAttributes}>
                {data.attributeEntries.length > 0 ? (
                  <div>
                    <h4>Atributos</h4>
                    <ul className={styles.list}>
                      {data.maskAttributes
                        ? renderMaskedRows(data.attributeEntries.length)
                        : data.attributeEntries.map((item) => (
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
                      {data.maskSkills
                        ? renderMaskedRows(data.skillEntries.length)
                        : data.skillEntries.map((item) => (
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

              {data.aboutText ? (
                <div>
                  <h4>Sobre</h4>
                  <p>{data.aboutText}</p>
                </div>
              ) : null}

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
          </>
        ) : (
          <div className={styles.tabPanel}>{tabContent}</div>
        )}

        {!isModal ? (
          <div className={styles.actionLinks}>
            <Link className={styles.actionLink} href={`/rpg/${data.rpgId}/characters`}>
              Voltar para personagens
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  )
}
