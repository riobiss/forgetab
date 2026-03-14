"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import {
  loadNpcMonsterAbilitiesUseCase,
  loadNpcMonsterInventoryUseCase,
  type CharacterInventoryItemDto,
  type PurchasedAbilityViewDto,
} from "@/application/characters/loadout"
import InventoryCards from "@/presentation/character-inventory/components/InventoryCards"
import { toInventoryCardItem } from "@/presentation/character-inventory/utils"
import AbilitiesFiltersClient from "@/presentation/character-abilities/AbilitiesFiltersClient"
import { createHttpNpcMonsterCharacterAbilitiesGateway } from "@/infrastructure/characterAbilities/gateways/httpNpcMonsterCharacterAbilitiesGateway"
import { createNpcMonsterLoadoutDependencies } from "@/presentation/characters/loadout"
import CharacterDetailPage from "@/presentation/characters-detail/CharacterDetailPage"
import styles from "../CharactersDashboardPage.module.css"

type Props = {
  data: CharacterDetailViewModel
  onEditNpcMonster: (params: {
    characterId: string
    characterType: "npc" | "monster"
  }) => void
}

const loadoutDeps = createNpcMonsterLoadoutDependencies("http")

export default function CharacterDetailModal({ data, onEditNpcMonster }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"about" | "abilities" | "items">("about")
  const [inventory, setInventory] = useState<CharacterInventoryItemDto[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState("")
  const [abilities, setAbilities] = useState<PurchasedAbilityViewDto[]>([])
  const [abilitiesLoading, setAbilitiesLoading] = useState(false)
  const [abilitiesError, setAbilitiesError] = useState("")
  const canInspectLoadout =
    data.characterType !== "player" && data.canEditCharacter
  const abilityDeps = useMemo(
    () => ({ gateway: createHttpNpcMonsterCharacterAbilitiesGateway(data.rpgId) }),
    [data.rpgId],
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    setActiveTab("about")
  }, [data.characterId])

  useEffect(() => {
    if (!canInspectLoadout) {
      setInventory([])
      setAbilities([])
      setInventoryError("")
      setAbilitiesError("")
      return
    }

    let cancelled = false

    async function loadLoadout() {
      try {
        setInventoryLoading(true)
        setAbilitiesLoading(true)
        setInventoryError("")
        setAbilitiesError("")

        const [inventoryResult, abilitiesResult] = await Promise.allSettled([
          loadNpcMonsterInventoryUseCase(loadoutDeps, {
            rpgId: data.rpgId,
            characterId: data.characterId,
          }),
          loadNpcMonsterAbilitiesUseCase(loadoutDeps, {
            rpgId: data.rpgId,
            characterId: data.characterId,
          }),
        ])

        if (cancelled) {
          return
        }

        if (inventoryResult.status === "fulfilled") {
          setInventory(inventoryResult.value.inventory)
        } else {
          setInventoryError(
            inventoryResult.reason instanceof Error
              ? inventoryResult.reason.message
              : "Nao foi possivel carregar os items.",
          )
        }

        if (abilitiesResult.status === "fulfilled") {
          setAbilities(abilitiesResult.value.abilities)
        } else {
          setAbilitiesError(
            abilitiesResult.reason instanceof Error
              ? abilitiesResult.reason.message
              : "Nao foi possivel carregar as habilidades.",
          )
        }
      } finally {
        if (!cancelled) {
          setInventoryLoading(false)
          setAbilitiesLoading(false)
        }
      }
    }

    void loadLoadout()

    return () => {
      cancelled = true
    }
  }, [canInspectLoadout, data.characterId, data.rpgId])

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("modal")
    params.delete("viewer")
    params.delete("characterId")
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  const tabs = canInspectLoadout
    ? [
        { key: "about", label: "Sobre" },
        { key: "abilities", label: "Habilidades" },
        { key: "items", label: "Items" },
      ]
    : undefined

  const tabContent =
    activeTab === "items" ? (
      <>
        {inventoryLoading ? <p className={styles.modalInfo}>Carregando items...</p> : null}
        {inventoryError ? <p className={styles.modalError}>{inventoryError}</p> : null}
        {!inventoryLoading ? (
          <InventoryCards
            items={inventory.map((item) => toInventoryCardItem(item))}
            emptyMessage="Nenhum item neste personagem."
          />
        ) : null}
      </>
    ) : activeTab === "abilities" ? (
      <>
        {abilitiesLoading ? <p className={styles.modalInfo}>Carregando habilidades...</p> : null}
        {abilitiesError ? <p className={styles.modalError}>{abilitiesError}</p> : null}
        {!abilitiesLoading ? (
          <AbilitiesFiltersClient
            characterId={data.characterId}
            abilities={abilities}
            deps={abilityDeps}
            canManage={false}
          />
        ) : null}
      </>
    ) : null

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Detalhes do personagem">
      <section className={`${styles.modalShell} ${styles.playerModalShell} ${styles.detailModalShell}`}>
        <CharacterDetailPage
          data={data}
          presentation="modal"
          onClose={handleClose}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabKey) => {
            if (tabKey === "about" || tabKey === "abilities" || tabKey === "items") {
              setActiveTab(tabKey)
            }
          }}
          tabContent={tabContent}
        />
      </section>
    </div>
  )
}
