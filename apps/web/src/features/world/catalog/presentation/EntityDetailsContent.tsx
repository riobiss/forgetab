"use client"

import { useState } from "react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogAbilityView,
  EntityCatalogPlayerItem
} from "@/features/world/catalog/application/types"
import EntityAbilitiesPanel from "@/features/world/catalog/presentation/EntityAbilitiesPanel"
import styles from "./EntityDetailsPage.module.css"

type ContentTab = "content" | "abilities" | "bonuses" | "players"
type ActiveBonus = { key: string; label: string; value: number }

type Props = {
  rpgId: string
  canManage: boolean
  contentEditing: boolean
  editorContent: JSONContent
  onEditorContentChange(content: JSONContent): void
  abilities: EntityCatalogAbilityView[]
  players: EntityCatalogPlayerItem[]
  abilityPurchase?: EntityCatalogAbilityPurchaseState
  attributeBonuses: ActiveBonus[]
  skillBonuses: ActiveBonus[]
}

function BonusCard({ title, items }: { title: string; items: ActiveBonus[] }) {
  if (items.length === 0) return null

  return (
    <section className={styles.bonusCard}>
      <header className={styles.bonusHeader}>
        <h2 className={styles.bonusTitle}>{title}</h2>
        <span className={styles.bonusCount}>{items.length}</span>
      </header>
      <div className={styles.bonusList}>
        {items.map((item) => (
          <div key={item.key} className={styles.bonusItem}>
            <span>{item.label}</span>
            <strong>{item.value > 0 ? `+${item.value}` : item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function EntityDetailsContent({
  rpgId,
  canManage,
  contentEditing,
  editorContent,
  onEditorContentChange,
  abilities,
  players,
  abilityPurchase,
  attributeBonuses,
  skillBonuses
}: Props) {
  const [activeTab, setActiveTab] = useState<ContentTab>("content")
  const hasBonuses = attributeBonuses.length > 0 || skillBonuses.length > 0

  return (
    <section className={styles.contentShell}>
      <div
        className={styles.contentTabs}
        role="tablist"
        aria-label="Conteudo da entidade"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "content"}
          className={`${styles.contentTab} ${activeTab === "content" ? styles.contentTabActive : ""}`}
          onClick={() => setActiveTab("content")}
        >
          Sobre
        </button>
        {abilities.length > 0 ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "abilities"}
            className={`${styles.contentTab} ${activeTab === "abilities" ? styles.contentTabActive : ""}`}
            onClick={() => setActiveTab("abilities")}
          >
            Habilidades
          </button>
        ) : null}
        {hasBonuses ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bonuses"}
            className={`${styles.contentTab} ${activeTab === "bonuses" ? styles.contentTabActive : ""}`}
            onClick={() => setActiveTab("bonuses")}
          >
            Bonus
          </button>
        ) : null}
        {players.length > 0 ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "players"}
            className={`${styles.contentTab} ${activeTab === "players" ? styles.contentTabActive : ""}`}
            onClick={() => setActiveTab("players")}
          >
            Players
          </button>
        ) : null}
      </div>

      {activeTab === "content" ? (
        <section className={styles.editorShell}>
          <SimpleEditor
            initialContent={editorContent}
            onJsonChange={onEditorContentChange}
            disabled={!canManage || !contentEditing}
            className="library-book-editor"
          />
        </section>
      ) : activeTab === "bonuses" ? (
        <section className={styles.abilitiesShell}>
          <div className={styles.bonusGrid}>
            <BonusCard title="Atributos" items={attributeBonuses} />
            <BonusCard title="Pericias" items={skillBonuses} />
          </div>
        </section>
      ) : activeTab === "players" ? (
        <section className={styles.abilitiesShell}>
          <div className={styles.playerGrid}>
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/rpg/${rpgId}/characters/${player.id}`}
                className={styles.playerCard}
              >
                <div className={styles.playerAvatar}>
                  {player.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.image} alt={player.name} />
                  ) : (
                    <span>{player.name.slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.playerMeta}>
                  <strong>{player.name}</strong>
                  <span>Player</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.abilitiesShell}>
          <EntityAbilitiesPanel skills={abilities} purchase={abilityPurchase} />
        </section>
      )}
    </section>
  )
}
