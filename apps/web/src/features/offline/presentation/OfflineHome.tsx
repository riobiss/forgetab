"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  OfflineCampaignSnapshotDto,
  OfflineCharacterSnapshotDto,
  OfflineSnapshotDto
} from "@forgetab/world-contracts/offline"
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  ChevronRight,
  Shield,
  Sparkles,
  Swords,
  Wifi,
  WifiOff
} from "lucide-react"
import { loadOfflineSnapshotUseCase } from "@/features/offline/application/use-cases/offlineSnapshot"
import { offlineDependencies } from "./dependencies"
import styles from "./OfflineHome.module.css"

type CharacterTab = "sheet" | "items" | "abilities"

function formatSyncDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "data desconhecida"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date)
}

export default function OfflineHome() {
  const [snapshot, setSnapshot] = useState<OfflineSnapshotDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CharacterTab>("sheet")

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    updateConnection()
    window.addEventListener("online", updateConnection)
    window.addEventListener("offline", updateConnection)

    void loadOfflineSnapshotUseCase(offlineDependencies.repository)
      .then(setSnapshot)
      .catch(() => setSnapshot(null))
      .finally(() => setLoading(false))

    return () => {
      window.removeEventListener("online", updateConnection)
      window.removeEventListener("offline", updateConnection)
    }
  }, [])

  const campaign = useMemo(
    () => snapshot?.campaigns.find((item) => item.id === campaignId) ?? null,
    [campaignId, snapshot]
  )
  const character = useMemo(
    () => campaign?.characters.find((item) => item.id === characterId) ?? null,
    [campaign, characterId]
  )

  const goBack = () => {
    if (character) {
      setCharacterId(null)
      setActiveTab("sheet")
    } else if (campaign) {
      setCampaignId(null)
    } else {
      setShowCampaigns(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => {
            setShowCampaigns(false)
            setCampaignId(null)
            setCharacterId(null)
          }}
          aria-label="Voltar ao inicio offline"
        >
          ForgeTab
        </button>
        <span className={isOnline ? styles.onlineBadge : styles.offlineBadge}>
          {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
          {isOnline ? "Conectado" : "Modo offline"}
        </span>
      </header>

      <div className={styles.content}>
        {!showCampaigns ? (
          <HomeScreen
            loading={loading}
            snapshot={snapshot}
            onOpenCampaigns={() => setShowCampaigns(true)}
          />
        ) : character && campaign ? (
          <CharacterScreen
            campaign={campaign}
            character={character}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={goBack}
          />
        ) : campaign ? (
          <CampaignScreen
            campaign={campaign}
            onBack={goBack}
            onSelectCharacter={setCharacterId}
          />
        ) : (
          <CampaignsScreen
            loading={loading}
            snapshot={snapshot}
            onBack={goBack}
            onSelectCampaign={setCampaignId}
          />
        )}
      </div>
    </main>
  )
}

function HomeScreen({
  loading,
  snapshot,
  onOpenCampaigns
}: {
  loading: boolean
  snapshot: OfflineSnapshotDto | null
  onOpenCampaigns(): void
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMark} aria-hidden="true">
        <Shield size={42} />
      </div>
      <p className={styles.eyebrow}>Companheiro de mesa</p>
      <h1>Suas aventuras continuam.</h1>
      <p className={styles.heroCopy}>
        Consulte fichas, itens e habilidades salvos neste dispositivo, mesmo
        quando a conexao falhar.
      </p>

      <button
        type="button"
        className={styles.primaryAction}
        onClick={onOpenCampaigns}
      >
        <BookOpen size={22} />
        <span>
          <strong>Campanhas</strong>
          <small>
            {loading
              ? "Carregando dados locais..."
              : `${snapshot?.campaigns.length ?? 0} disponivel(is)`}
          </small>
        </span>
        <ChevronRight size={22} />
      </button>

      {!loading && !snapshot ? (
        <p className={styles.notice}>
          Nenhum dado foi salvo ainda. Conecte-se e abra o ForgeTab para
          preparar o acesso offline.
        </p>
      ) : snapshot ? (
        <p className={styles.syncLabel}>
          Ultima atualizacao: {formatSyncDate(snapshot.syncedAt)}
        </p>
      ) : null}
    </section>
  )
}

function BackHeader({ title, onBack }: { title: string; onBack(): void }) {
  return (
    <div className={styles.sectionHeader}>
      <button type="button" onClick={onBack} className={styles.backButton}>
        <ArrowLeft size={20} /> Voltar
      </button>
      <h1>{title}</h1>
    </div>
  )
}

function CampaignsScreen({
  loading,
  snapshot,
  onBack,
  onSelectCampaign
}: {
  loading: boolean
  snapshot: OfflineSnapshotDto | null
  onBack(): void
  onSelectCampaign(id: string): void
}) {
  return (
    <section className={styles.section}>
      <BackHeader title="Campanhas" onBack={onBack} />
      {loading ? (
        <p className={styles.empty}>Carregando campanhas salvas...</p>
      ) : snapshot?.campaigns.length ? (
        <div className={styles.campaignGrid}>
          {snapshot.campaigns.map((campaign) => (
            <button
              type="button"
              key={campaign.id}
              className={styles.campaignCard}
              onClick={() => onSelectCampaign(campaign.id)}
            >
              {campaign.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.image} alt="" />
              ) : (
                <span className={styles.imageFallback}>
                  <BookOpen size={32} />
                </span>
              )}
              <span className={styles.cardBody}>
                <strong>{campaign.title}</strong>
                <small>
                  {campaign.characters.length} personagem(ns) salvo(s)
                </small>
              </span>
              <ChevronRight size={21} />
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Nenhuma campanha esta disponivel offline.
        </p>
      )}
    </section>
  )
}

function CampaignScreen({
  campaign,
  onBack,
  onSelectCharacter
}: {
  campaign: OfflineCampaignSnapshotDto
  onBack(): void
  onSelectCharacter(id: string): void
}) {
  return (
    <section className={styles.section}>
      <BackHeader title={campaign.title} onBack={onBack} />
      {campaign.description ? (
        <p className={styles.campaignDescription}>{campaign.description}</p>
      ) : null}
      <h2 className={styles.subheading}>Seus personagens</h2>
      {campaign.characters.length ? (
        <div className={styles.characterGrid}>
          {campaign.characters.map((character) => (
            <button
              type="button"
              key={character.id}
              className={styles.characterCard}
              onClick={() => onSelectCharacter(character.id)}
            >
              {character.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={character.image} alt="" />
              ) : (
                <span className={styles.avatarFallback}>
                  {character.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <strong>{character.name}</strong>
                <small>
                  {character.classLabel} · {character.progressionLevelDisplay}
                </small>
              </span>
              <ChevronRight size={21} />
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Voce ainda nao possui personagem nesta campanha.
        </p>
      )}
    </section>
  )
}

function CharacterScreen({
  campaign,
  character,
  activeTab,
  onTabChange,
  onBack
}: {
  campaign: OfflineCampaignSnapshotDto
  character: OfflineCharacterSnapshotDto
  activeTab: CharacterTab
  onTabChange(tab: CharacterTab): void
  onBack(): void
}) {
  return (
    <section className={styles.section}>
      <BackHeader title={character.name} onBack={onBack} />
      <p className={styles.characterMeta}>
        {campaign.title} · {character.classLabel} ·{" "}
        {character.progressionLevelDisplay}
      </p>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Dados do personagem"
      >
        <TabButton
          active={activeTab === "sheet"}
          onClick={() => onTabChange("sheet")}
        >
          <Shield size={18} /> Ficha
        </TabButton>
        <TabButton
          active={activeTab === "items"}
          onClick={() => onTabChange("items")}
        >
          <Backpack size={18} /> Itens
        </TabButton>
        <TabButton
          active={activeTab === "abilities"}
          onClick={() => onTabChange("abilities")}
        >
          <Sparkles size={18} /> Habilidades
        </TabButton>
      </div>

      {activeTab === "sheet" ? <SheetTab character={character} /> : null}
      {activeTab === "items" ? <ItemsTab character={character} /> : null}
      {activeTab === "abilities" ? (
        <AbilitiesTab character={character} />
      ) : null}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick(): void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={active ? styles.activeTab : styles.tab}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SheetTab({ character }: { character: OfflineCharacterSnapshotDto }) {
  return (
    <div className={styles.dataSections}>
      <DataGroup title="Status">
        {character.statusEntries.map((entry) => (
          <div key={entry.key} className={styles.statusRow}>
            <span>{entry.label}</span>
            <strong>
              {entry.current} / {entry.max}
            </strong>
            <span className={styles.meter}>
              <span
                style={{
                  width: `${Math.min(100, Math.max(0, entry.max ? (entry.current / entry.max) * 100 : 0))}%`
                }}
              />
            </span>
          </div>
        ))}
      </DataGroup>
      <DataGroup title="Atributos">
        <div className={styles.statGrid}>
          {character.attributeEntries.map((entry) => (
            <div key={entry.key}>
              <span>{entry.label}</span>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      </DataGroup>
      <DataGroup title="Pericias">
        <div className={styles.statGrid}>
          {character.skillEntries.map((entry) => (
            <div key={entry.key}>
              <span>{entry.label}</span>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      </DataGroup>
    </div>
  )
}

function DataGroup({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.dataGroup}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function ItemsTab({ character }: { character: OfflineCharacterSnapshotDto }) {
  if (!character.inventory.length)
    return <p className={styles.empty}>O inventario esta vazio.</p>

  return (
    <div className={styles.list}>
      {character.inventory.map((item) => (
        <article key={item.id} className={styles.listCard}>
          <div className={styles.listCardTitle}>
            <Backpack size={19} />
            <h2>{item.itemName}</h2>
            <span>x{item.quantity}</span>
          </div>
          <p className={styles.tagLine}>
            {item.itemType} · {item.itemRarity}
          </p>
          {item.itemDescription ? <p>{item.itemDescription}</p> : null}
          {item.itemDamage ? <small>Dano: {item.itemDamage}</small> : null}
          {item.itemRange ? <small>Alcance: {item.itemRange}</small> : null}
          {item.itemAbility ? (
            <small>Habilidade: {item.itemAbility}</small>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function AbilitiesTab({
  character
}: {
  character: OfflineCharacterSnapshotDto
}) {
  if (!character.abilities.length)
    return <p className={styles.empty}>Nenhuma habilidade adquirida.</p>

  return (
    <div className={styles.list}>
      {character.abilities.map((ability) => (
        <article
          key={`${ability.skillId}-${ability.levelNumber}`}
          className={styles.listCard}
        >
          <div className={styles.listCardTitle}>
            <Swords size={19} />
            <h2>{ability.skillName}</h2>
            <span>Nv. {ability.levelNumber}</span>
          </div>
          {ability.levelName ? (
            <p className={styles.tagLine}>{ability.levelName}</p>
          ) : null}
          {ability.summary ? <p>{ability.summary}</p> : null}
          {ability.levelDescription ? <p>{ability.levelDescription}</p> : null}
          <div className={styles.inlineStats}>
            {ability.damage ? <small>Dano: {ability.damage}</small> : null}
            {ability.range ? <small>Alcance: {ability.range}</small> : null}
            {ability.resourceCost ? (
              <small>Custo: {ability.resourceCost}</small>
            ) : null}
            {ability.cooldown ? (
              <small>Recarga: {ability.cooldown}</small>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
