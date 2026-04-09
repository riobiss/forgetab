"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { ArrowLeft, DoorOpen, Info, LogOut, MessageCircle, OctagonX, Plus, SendHorizontal, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import { getClientAuthToken } from "@/infrastructure/auth/session/clientAuthSession"
import { fetchCharacterAbilitiesViewModel } from "@/infrastructure/characterAbilities/repositories/httpCharacterAbilitiesPageRepository"
import { getConfiguredApiBaseUrl } from "@/infrastructure/http/backendUrls"
import {
  clearCampaignPresence,
  getCampaignSelectedCharacter,
  setCampaignPresence,
  type CampaignSelectedCharacter,
} from "@/infrastructure/rpgCampaign/campaignPresence"
import { httpRpgCampaignRepository } from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import abilityStyles from "@/presentation/character-abilities/CharacterAbilitiesPage.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type ChatTarget = { type: "campaign" } | { type: "direct"; userId: string } | null
type DiceRollGroup = {
  diceCount: number
  diceSides: number
  results: number[]
  total: number
}

type DiceRollActionPayload = {
  type: "dice_roll"
  total: number
  groups: DiceRollGroup[]
}

type SkillUseActionPayload = {
  type: "skill_use"
  characterId?: string
  characterName: string
  ability: PurchasedAbilityViewDto
}

type DiceRollPreviewGroup = {
  diceCount: number
  diceSides: number
  results: string[]
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

const SKILL_CATEGORY_LABEL: Record<string, string> = {
  tecnicas: "Tecnicas",
  arcana: "Arcana",
  espiritual: "Espiritual",
  mental: "Mental",
  natural: "Natural",
  tecnologica: "Tecnologica",
}

const SKILL_TYPE_LABEL: Record<string, string> = {
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
  resource: "Recurso",
}

const SKILL_ACTION_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

function toCategoryLabel(value: string | null) {
  if (!value) return null
  return SKILL_CATEGORY_LABEL[value] ?? value
}

function toTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_TYPE_LABEL[value] ?? value
}

function toActionTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_ACTION_TYPE_LABEL[value] ?? value
}

function parseDiceRollAction(content: string): DiceRollActionPayload | null {
  if (!content.startsWith("__ROLL__")) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice("__ROLL__".length)) as DiceRollActionPayload
    if (
      parsedContent?.type !== "dice_roll" ||
      typeof parsedContent.total !== "number" ||
      !Array.isArray(parsedContent.groups)
    ) {
      const legacyContent = parsedContent as DiceRollActionPayload & {
        diceCount?: number
        diceSides?: number
        results?: number[]
      }

      if (
        typeof legacyContent?.diceCount !== "number" ||
        typeof legacyContent?.diceSides !== "number" ||
        !Array.isArray(legacyContent.results)
      ) {
        return null
      }

      return {
        type: "dice_roll",
        total: legacyContent.total,
        groups: [
          {
            diceCount: legacyContent.diceCount,
            diceSides: legacyContent.diceSides,
            results: legacyContent.results,
            total: legacyContent.results.reduce((sum, value) => sum + value, 0),
          },
        ],
      }
    }

    return parsedContent
  } catch {
    return null
  }
}

function parseSkillUseAction(content: string): SkillUseActionPayload | null {
  if (!content.startsWith("__SKILL_USE__")) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice("__SKILL_USE__".length)) as SkillUseActionPayload
    if (
      parsedContent?.type !== "skill_use" ||
      typeof parsedContent.characterName !== "string" ||
      !parsedContent.ability ||
      typeof parsedContent.ability.skillId !== "string"
    ) {
      return null
    }

    return parsedContent
  } catch {
    return null
  }
}

type Props = {
  rpgId: string
  initialRoom: RpgCampaignRoomViewModel
}

export function RpgCampaignRoomPage({ rpgId, initialRoom }: Props) {
  const router = useRouter()
  const [room, setRoom] = useState(initialRoom)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialRoom.participants[0]?.userId ?? null,
  )
  const [selectedChat, setSelectedChat] = useState<ChatTarget>(null)
  const [campaignMessage, setCampaignMessage] = useState("")
  const [directMessage, setDirectMessage] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CampaignSelectedCharacter | null>(null)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false)
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [diceEntries, setDiceEntries] = useState<Array<{ diceCount: string; diceSides: string }>>([
    { diceCount: "1", diceSides: "20" },
  ])
  const [dicePreviewGroups, setDicePreviewGroups] = useState<DiceRollPreviewGroup[] | null>(null)
  const [characterAbilities, setCharacterAbilities] = useState<PurchasedAbilityViewDto[]>([])
  const [isLoadingCharacterAbilities, setIsLoadingCharacterAbilities] = useState(false)
  const [selectedAbilityDetails, setSelectedAbilityDetails] = useState<PurchasedAbilityViewDto | null>(null)
  const [selectedAbilityDetailsMode, setSelectedAbilityDetailsMode] = useState<"view" | "use">("view")
  const [expandedRollIds, setExpandedRollIds] = useState<Record<string, boolean>>({})
  const refreshInFlightRef = useRef(false)
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const availableDirectParticipants = useMemo(
    () => room.participants.filter((participant) => participant.userId !== room.viewerUserId),
    [room.participants, room.viewerUserId],
  )

  const selectedParticipant =
    availableDirectParticipants.find((participant) => participant.userId === selectedUserId) ?? null

  const directThread = useMemo(() => {
    if (!selectedUserId) return []
    return room.directMessages.filter(
      (message) =>
        message.authorId === selectedUserId || message.recipientUserId === selectedUserId,
    )
  }, [room.directMessages, selectedUserId])

  const selectedConversationTitle =
    selectedChat?.type === "campaign"
      ? "Chat da campanha"
      : selectedParticipant?.name ?? "Chat privado"
  const isCampaignEnded = !room.campaign.isActive

  function closeDiceModal() {
    setIsDiceModalOpen(false)
    setDicePreviewGroups(null)
  }

  function openChatList() {
    setSelectedChat(null)
    setIsChatOpen(true)
  }

  function renderActionMessage(message: RpgCampaignRoomViewModel["actionMessages"][number]) {
    const diceRoll = parseDiceRollAction(message.content)
    const skillUse = parseSkillUseAction(message.content)

    if (skillUse) {
      const primaryTag = skillUse.ability.skillTags[0]
      const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
      const abilityName = skillUse.ability.levelName ?? skillUse.ability.skillName

      return (
        <article key={message.id} className={styles.streamCard}>
          <div className={styles.skillActionHeader}>
            <div className={styles.skillActionIdentity}>
              <span className={styles.skillActionCharacter}>{skillUse.characterName}</span>
              <strong
                className={styles.skillActionName}
                style={
                  tagMeta
                    ? ({
                        "--skill-action-name-color": tagMeta.text,
                        "--skill-action-name-bg": tagMeta.bg,
                        "--skill-action-name-border": tagMeta.border,
                      } as CSSProperties)
                    : undefined
                }
              >
                {abilityName}
              </strong>
            </div>
            <button
              type="button"
              className={styles.skillInfoButton}
              onClick={() => {
                void openLatestAbilityDetails({
                  ability: skillUse.ability,
                  mode: "view",
                  characterId: skillUse.characterId ?? selectedCharacter?.id ?? null,
                })
              }}
              aria-label="Ver detalhes da habilidade"
            >
              <Info size={16} />
            </button>
          </div>
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
        </article>
      )
    }

    if (!diceRoll) {
      return (
        <article key={message.id} className={styles.streamCard}>
          <p className={styles.streamContent}>{message.content}</p>
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
        </article>
      )
    }

    const isExpanded = Boolean(expandedRollIds[message.id])

    return (
      <article key={message.id} className={styles.streamCard}>
        <div className={styles.rollResultRow}>
          <strong className={styles.rollTotal}>Total: {diceRoll.total}</strong>
          <button
            type="button"
            className={styles.rollDetailsButton}
            onClick={() =>
              setExpandedRollIds((currentState) => ({
                ...currentState,
                [message.id]: !currentState[message.id],
              }))
            }
          >
            {isExpanded ? "Ocultar sequencia" : "Ver sequencia"}
          </button>
        </div>
        <div className={styles.rollGroupList}>
          {diceRoll.groups.map((group, index) => (
            <p key={`${message.id}-group-${index}`} className={styles.rollGroupLine}>
              {group.diceCount}d{group.diceSides}: {group.total}.
            </p>
          ))}
        </div>
        {isExpanded ? (
          <div className={styles.rollSequenceList}>
            {diceRoll.groups.map((group, index) => (
              <p key={`${message.id}-sequence-${index}`} className={styles.rollSequence}>
                {group.diceCount}d{group.diceSides}: {group.results.join(" + ")}
              </p>
            ))}
          </div>
        ) : null}
        <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
      </article>
    )
  }

  function renderAbilityTaggedCard(ability: PurchasedAbilityViewDto, titleAsButton = false) {
    const primaryTag = ability.skillTags[0]
    const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
    const abilityName = ability.levelName ?? ability.skillName
    const levelDescription = hasText(ability.levelDescription)
      ? ability.levelDescription
      : hasText(ability.summary)
        ? ability.summary
        : null
    const baseDescription = normalizeText(ability.skillDescription)
    const levelDescriptionNormalized = normalizeText(levelDescription)
    const showLevelDescription =
      levelDescriptionNormalized.length > 0 && levelDescriptionNormalized !== baseDescription

    return (
      <article
        className={
          tagMeta
            ? `${abilityStyles.card} ${abilityStyles.cardTagged}`
            : abilityStyles.card
        }
        style={
          tagMeta
            ? ({
                "--tag-card-c1": tagMeta.cardC1,
                "--tag-card-c2": tagMeta.cardC2,
                "--tag-card-c3": tagMeta.cardC3,
                "--tag-card-border": tagMeta.cardBorder,
                "--tag-card-glow": tagMeta.cardGlow,
                "--tag-card-key-text": tagMeta.cardKeyText,
                "--tag-card-value-text": tagMeta.cardValueText,
              } as CSSProperties)
            : undefined
        }
      >
        <div className={abilityStyles.cardHeader}>
          <h3 className={abilityStyles.cardTitle}>
            {titleAsButton ? (
              <button
                type="button"
                className={abilityStyles.skillTitleButton}
                onClick={() => {
                  void openLatestAbilityDetails({
                    ability,
                    mode: "view",
                    characterId: selectedCharacter?.id ?? null,
                  })
                }}
              >
                {abilityName}
              </button>
            ) : (
              abilityName
            )}
          </h3>
          <span className={abilityStyles.levelBadge}>Level {ability.levelNumber}</span>
        </div>

        {ability.skillDescription ? (
          <p className={abilityStyles.cardBodyItalic}>{ability.skillDescription}</p>
        ) : null}
        {showLevelDescription ? (
          <p className={abilityStyles.cardBodyItalic}>{levelDescription}</p>
        ) : null}

        <div className={abilityStyles.cardDetailsGrid}>
          {hasText(ability.skillActionType) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>ACAO</span>
              <span className={abilityStyles.detailValue}>
                {toActionTypeLabel(ability.skillActionType)}
              </span>
            </div>
          ) : null}
          {hasText(ability.damage) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>DANO</span>
              <span className={abilityStyles.detailValue}>{ability.damage}</span>
            </div>
          ) : null}
          {hasText(ability.range) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>ALCANCE</span>
              <span className={abilityStyles.detailValue}>{ability.range}</span>
            </div>
          ) : null}
          {hasText(ability.cooldown) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>RECARGA</span>
              <span className={abilityStyles.detailValue}>{ability.cooldown}</span>
            </div>
          ) : null}
          {hasText(ability.duration) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>DURACAO</span>
              <span className={abilityStyles.detailValue}>{ability.duration}</span>
            </div>
          ) : null}
          {hasText(ability.castTime) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>CONJURACAO</span>
              <span className={abilityStyles.detailValue}>{ability.castTime}</span>
            </div>
          ) : null}
          {hasText(ability.resourceCost) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>CUSTO RECURSO</span>
              <span className={abilityStyles.detailValue}>{ability.resourceCost}</span>
            </div>
          ) : null}
          {hasText(ability.costCustom) ? (
            <div className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>CUSTO</span>
              <span className={abilityStyles.detailValue}>{ability.costCustom}</span>
            </div>
          ) : null}
          {ability.notesList.length > 0 ? (
            <div className={`${abilityStyles.detailItem} ${abilityStyles.detailFull}`}>
              <span className={abilityStyles.detailLabelOrange}>OBS</span>
              <span className={abilityStyles.detailValue}>{ability.notesList.join(" | ")}</span>
            </div>
          ) : null}
          {ability.customFields.map((field) => (
            <div key={field.id} className={abilityStyles.detailItem}>
              <span className={abilityStyles.detailLabelOrange}>{field.name}</span>
              <span className={abilityStyles.detailValue}>{field.value ?? "-"}</span>
            </div>
          ))}
        </div>
      </article>
    )
  }

  function renderChatMessage(
    message: RpgCampaignRoomViewModel["campaignMessages"][number],
    showAuthor: boolean,
  ) {
    const isOwnMessage = message.authorId === room.viewerUserId
    const authorLabel = isOwnMessage ? "Voce" : message.authorName

    return (
      <article
        key={message.id}
        className={`${styles.chatBubble} ${isOwnMessage ? styles.chatBubbleOwn : styles.chatBubbleOther}`}
      >
        {showAuthor ? (
          <p className={styles.chatBubbleMeta}>
            <strong>{authorLabel}</strong> {!isOwnMessage ? `@${message.authorUsername}` : null}
          </p>
        ) : null}
        <p className={styles.chatBubbleContent}>
          {message.content}
          <span className={styles.chatBubbleTime}>{formatTime(message.createdAt)}</span>
        </p>
      </article>
    )
  }

  function appendMessageLocally(message: RpgCampaignRoomViewModel["campaignMessages"][number]) {
    startTransition(() => {
      setRoom((currentRoom) => {
        if (message.kind === "campaign") {
          return {
            ...currentRoom,
            campaignMessages: [...currentRoom.campaignMessages, message],
          }
        }

        if (message.kind === "action") {
          return {
            ...currentRoom,
            actionMessages: [...currentRoom.actionMessages, message],
          }
        }

        return {
          ...currentRoom,
          directMessages: [...currentRoom.directMessages, message],
        }
      })
    })
  }

  async function refreshRoom() {
    if (refreshInFlightRef.current) {
      return
    }

    refreshInFlightRef.current = true
    try {
      const nextRoom = await httpRpgCampaignRepository.fetchRoomViewModel(rpgId, room.campaign.id)
      startTransition(() => {
        setRoom(nextRoom)
        if (
          !nextRoom.participants.some((participant) => participant.userId === selectedUserId) ||
          selectedUserId === nextRoom.viewerUserId
        ) {
          const firstAvailableParticipant = nextRoom.participants.find(
            (participant) => participant.userId !== nextRoom.viewerUserId,
          )
          setSelectedUserId(firstAvailableParticipant?.userId ?? null)
        }
      })
    } finally {
      refreshInFlightRef.current = false
    }
  }

  useEffect(() => {
    const token = getClientAuthToken()
    if (!token) {
      return
    }

    const socket: Socket = io(getConfiguredApiBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
      withCredentials: true,
    })

    const joinRoom = () => {
      socket.emit("campaign:join-room", {
        rpgId,
        campaignId: initialRoom.campaign.id,
      })
    }

    socket.on("connect", joinRoom)
    socket.on("campaign:refresh", async (payload: { campaignId?: string }) => {
      if (payload.campaignId !== initialRoom.campaign.id) {
        return
      }

      try {
        await refreshRoom()
      } catch {
        // Keep the current UI responsive even if one refresh fails.
      }
    })

    return () => {
      socket.off("connect", joinRoom)
      socket.disconnect()
    }
  }, [initialRoom.campaign.id, rpgId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshRoom().catch(() => {
        // Socket remains the primary path; polling is a quiet fallback.
      })
    }, 2500)

    return () => {
      window.clearInterval(interval)
    }
  }, [rpgId, room.campaign.id])

  async function runAction(action: () => Promise<{ message?: string }>) {
    setIsBusy(true)
    setError(null)
    setSuccess(null)

    try {
      await action()
      await refreshRoom()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel concluir a acao.")
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    const textarea = composerTextareaRef.current
    if (!textarea) return

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [campaignMessage, directMessage, selectedChat])

  useEffect(() => {
    setSelectedCharacter(getCampaignSelectedCharacter(room.campaign.id))
  }, [room.campaign.id])

  useEffect(() => {
    if (room.campaign.isActive) {
      setCampaignPresence({
        rpgId,
        campaignId: room.campaign.id,
        title: room.campaign.title,
      })
      return
    }

    clearCampaignPresence()
  }, [room.campaign.id, room.campaign.isActive, room.campaign.title, rpgId])

  async function submitCurrentMessage() {
    if (selectedChat?.type === "campaign") {
      const trimmedMessage = campaignMessage.trim()
      if (!trimmedMessage) return

      await runAction(async () => {
        const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
          content: trimmedMessage,
          kind: "campaign",
        })
        if ("chatMessage" in payload && payload.chatMessage) {
          appendMessageLocally(payload.chatMessage)
        }
        setCampaignMessage("")
        return payload
      })
      return
    }

    if (!selectedParticipant) return

    const trimmedMessage = directMessage.trim()
    if (!trimmedMessage) return

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content: trimmedMessage,
        kind: "direct",
        recipientUserId: selectedParticipant.userId,
      })
      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }
      setDirectMessage("")
      return payload
    })
  }

  async function handleLeaveCampaign() {
    if (isBusy) return

    setIsBusy(true)
    setError(null)

    try {
      await httpRpgCampaignRepository.leaveCampaign(rpgId, room.campaign.id)
      clearCampaignPresence()
      router.push(`/rpg/${rpgId}`)
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel sair da campanha.")
    } finally {
      setIsBusy(false)
    }
  }

  function handleBackToRpg() {
    router.push(`/rpg/${rpgId}`)
  }

  async function handleEndCampaign() {
    if (isBusy) return

    setIsBusy(true)
    setError(null)

    try {
      await httpRpgCampaignRepository.endCampaign(rpgId, room.campaign.id)
      clearCampaignPresence()
      router.push(`/rpg/${rpgId}`)
      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel encerrar a campanha.")
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDiceRoll() {
    const groups: DiceRollPreviewGroup[] = []

    for (const entry of diceEntries) {
      const nextDiceCount = Number(entry.diceCount)
      const nextDiceSides = Number(entry.diceSides)

      if (!Number.isInteger(nextDiceCount) || nextDiceCount < 1 || nextDiceCount > 20) {
        setError("Escolha entre 1 e 20 dados por linha.")
        return
      }

      if (!Number.isInteger(nextDiceSides) || nextDiceSides < 2 || nextDiceSides > 100) {
        setError("Escolha um dado entre 2 e 100 lados por linha.")
        return
      }

      const results = Array.from({ length: nextDiceCount }, () => Math.floor(Math.random() * nextDiceSides) + 1)
      groups.push({
        diceCount: nextDiceCount,
        diceSides: nextDiceSides,
        results: results.map(String),
      })
    }

    if (room.isOwner) {
      setDicePreviewGroups(groups)
      return
    }

    await submitDiceRoll(groups)
  }

  async function openSkillModal() {
    if (!selectedCharacter?.id || room.isOwner) {
      return
    }

    setIsActionMenuOpen(false)
    setIsSkillModalOpen(true)
    setIsLoadingCharacterAbilities(true)
    setError(null)

    try {
      const payload = await fetchCharacterAbilitiesViewModel(rpgId, selectedCharacter.id)
      setCharacterAbilities(payload.abilities)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar as habilidades.")
    } finally {
      setIsLoadingCharacterAbilities(false)
    }
  }

  async function openLatestAbilityDetails(params: {
    ability: PurchasedAbilityViewDto
    mode: "view" | "use"
    characterId?: string | null
  }) {
    setSelectedAbilityDetailsMode(params.mode)

    if (!params.characterId) {
      const cachedAbility =
        characterAbilities.find(
          (item) =>
            item.skillId === params.ability.skillId &&
            item.levelNumber === params.ability.levelNumber,
        ) ?? params.ability

      setSelectedAbilityDetails(cachedAbility)
      return
    }

    try {
      const payload = await fetchCharacterAbilitiesViewModel(rpgId, params.characterId)
      setCharacterAbilities(payload.abilities)
      const latestAbility =
        payload.abilities.find(
          (item) =>
            item.skillId === params.ability.skillId &&
            item.levelNumber === params.ability.levelNumber,
        ) ?? params.ability

      setSelectedAbilityDetails(latestAbility)
    } catch {
      setSelectedAbilityDetails(params.ability)
    }
  }

  async function handleUseAbility(ability: PurchasedAbilityViewDto) {
    if (!selectedCharacter) {
      setError("Selecione um personagem para usar habilidade.")
      return
    }

    const content = `__SKILL_USE__${JSON.stringify({
      type: "skill_use",
      characterId: selectedCharacter.id,
      characterName: selectedCharacter.name,
      ability,
    } satisfies SkillUseActionPayload)}`

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsSkillModalOpen(false)
      setSelectedAbilityDetails(null)
      setSelectedAbilityDetailsMode("view")
      return payload
    })
  }

  async function submitDiceRoll(groupsSource: DiceRollPreviewGroup[]) {
    const groups: DiceRollGroup[] = []

    for (const group of groupsSource) {
      const results = group.results.map((value) => Number(value))
      const hasInvalidValue = results.some(
        (value) => !Number.isInteger(value) || value < 1 || value > group.diceSides,
      )

      if (hasInvalidValue) {
        setError(`Os resultados de ${group.diceCount}d${group.diceSides} precisam ficar entre 1 e ${group.diceSides}.`)
        return
      }

      groups.push({
        diceCount: group.diceCount,
        diceSides: group.diceSides,
        results,
        total: results.reduce((sum, value) => sum + value, 0),
      })
    }

    const total = groups.reduce((sum, group) => sum + group.total, 0)
    const content = `__ROLL__${JSON.stringify({
      type: "dice_roll",
      total,
      groups,
    } satisfies DiceRollActionPayload)}`

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsDiceModalOpen(false)
      setIsActionMenuOpen(false)
      setDiceEntries([{ diceCount: "1", diceSides: "20" }])
      setDicePreviewGroups(null)
      return payload
    })
  }

  if (isChatOpen) {
    return (
      <main className={styles.page}>
        <div className={`${styles.container} ${styles.containerChatMode}`}>
          <section className={`${styles.panel} ${styles.panelChatMode}`}>
            {selectedChat === null ? (
              <div className={styles.chatPanelHeader}>
                <h2 className={styles.sectionTitle}>Chat</h2>
                <button type="button" className={styles.closeChatButton} onClick={() => setIsChatOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div className={styles.chatLayout}>
              {selectedChat?.type === "campaign" || (selectedChat?.type === "direct" && selectedParticipant) ? (
                <div className={styles.chatConversation}>
                  <div className={styles.conversationHeader}>
                    <button type="button" className={styles.backToChatList} onClick={() => setSelectedChat(null)}>
                      <ArrowLeft size={16} />
                    </button>
                    <div className={styles.conversationIdentity}>
                      <h2 className={styles.conversationTitle}>{selectedConversationTitle}</h2>
                    </div>
                    <button type="button" className={styles.closeChatButton} onClick={() => setIsChatOpen(false)}>
                      <X size={16} />
                    </button>
                  </div>

                  <div className={styles.stream}>
                    {selectedChat?.type === "campaign" ? (
                      room.campaignMessages.length === 0 ? (
                        <p className={styles.emptyState}>Ainda nao ha mensagens no chat da campanha.</p>
                      ) : (
                        room.campaignMessages.map((message, index, messages) =>
                          renderChatMessage(
                            message,
                            index === 0 || messages[index - 1]?.authorId !== message.authorId,
                          ),
                        )
                      )
                    ) : directThread.length === 0 ? (
                      <p className={styles.emptyState}>Nenhuma mensagem privada com essa pessoa ainda.</p>
                    ) : (
                      directThread.map((message) => renderChatMessage(message, false))
                    )}
                  </div>

                  <form
                    className={styles.composer}
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (isCampaignEnded) return
                      void submitCurrentMessage()
                    }}
                  >
                    <textarea
                      ref={composerTextareaRef}
                      rows={1}
                      value={selectedChat?.type === "campaign" ? campaignMessage : directMessage}
                      onChange={(event) =>
                        selectedChat?.type === "campaign"
                          ? setCampaignMessage(event.target.value)
                          : setDirectMessage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          if (isCampaignEnded) return
                          void submitCurrentMessage()
                        }
                      }}
                      placeholder={
                        selectedChat?.type === "campaign" || selectedParticipant
                          ? "Digite uma mensagem"
                          : "Selecione um contato para conversar..."
                      }
                    />
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={
                        isBusy || isCampaignEnded || (selectedChat?.type === "direct" && !selectedParticipant)
                      }
                      aria-label="Enviar mensagem"
                    >
                      <SendHorizontal size={18} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className={styles.chatListPane}>
                  <div className={styles.chatList}>
                    <button type="button" className={styles.chatListItem} onClick={() => setSelectedChat({ type: "campaign" })}>
                      <div className={styles.chatAvatar}>C</div>
                      <div className={styles.chatListText}>
                        <strong>Chat da campanha</strong>
                        <small>Todos os participantes falam aqui</small>
                      </div>
                    </button>

                    {availableDirectParticipants.map((participant) => (
                      <button
                        key={participant.userId}
                        type="button"
                        className={styles.chatListItem}
                        onClick={() => {
                          setSelectedUserId(participant.userId)
                          setSelectedChat({ type: "direct", userId: participant.userId })
                        }}
                      >
                        <div className={styles.chatAvatar}>{participant.name.slice(0, 1).toUpperCase()}</div>
                        <div className={styles.chatListText}>
                          <strong>{participant.name}</strong>
                          <small>@{participant.username}</small>
                        </div>
                      </button>
                    ))}

                    {availableDirectParticipants.length === 0 ? (
                      <p className={styles.emptyState}>Nenhum outro participante disponivel para chat privado.</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{room.campaign.title}</h1>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.headerActionButton} onClick={handleBackToRpg}>
              <DoorOpen size={16} /> Voltar
            </button>
            {room.isOwner && room.campaign.isActive ? (
              <button
                type="button"
                className={styles.headerActionButton}
                onClick={() => {
                  void handleEndCampaign()
                }}
                disabled={isBusy}
              >
                <OctagonX size={16} /> Terminar campanha
              </button>
            ) : null}
            <button
              type="button"
              className={styles.headerActionButton}
              onClick={() => {
                void handleLeaveCampaign()
              }}
              disabled={isBusy}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}
        {isCampaignEnded ? (
          <p className={styles.endedBanner}>Campanha encerrada</p>
        ) : null}
        {selectedCharacter ? (
          <div className={styles.selectedCharacterCard}>
            {selectedCharacter.image ? (
              <img
                src={selectedCharacter.image}
                alt={selectedCharacter.name}
                className={styles.selectedCharacterImage}
              />
            ) : (
              <div className={styles.selectedCharacterFallback}>
                {selectedCharacter.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className={styles.selectedCharacterInfo}>
              <strong>{selectedCharacter.name}</strong>
              <small>Personagem em jogo</small>
            </div>
          </div>
        ) : null}

        <div className={styles.contentGrid}>
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Campanha</h2>
            <p className={styles.campaignDescription}>{room.campaign.description}</p>
            <div className={styles.stream}>
              {room.actionMessages.length === 0 ? (
                <p className={styles.emptyState}>
                  Nenhuma acao registrada ainda. Aqui vao aparecer eventos da sessao e, depois, usos de habilidade.
                </p>
              ) : (
                room.actionMessages.map((message) => renderActionMessage(message))
              )}
            </div>
          </section>
        </div>

        {!isCampaignEnded ? (
          <button
            type="button"
            className={styles.actionFab}
            onClick={() => setIsActionMenuOpen((currentState) => !currentState)}
            aria-label="Abrir acoes da campanha"
          >
            <Sparkles size={22} />
          </button>
        ) : null}
        <button type="button" className={styles.chatFab} onClick={openChatList} aria-label="Abrir chat">
          <MessageCircle size={22} />
        </button>

        {isActionMenuOpen ? (
          <div className={styles.actionMenu}>
            {!room.isOwner && selectedCharacter ? (
              <button
                type="button"
                className={styles.actionMenuItem}
                onClick={() => {
                  void openSkillModal()
                }}
              >
                Usar habilidade
              </button>
            ) : null}
            <button
              type="button"
              className={styles.actionMenuItem}
              onClick={() => {
                setIsDiceModalOpen(true)
                setIsActionMenuOpen(false)
              }}
            >
              Girar dado
            </button>
          </div>
        ) : null}

        {isSkillModalOpen ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsSkillModalOpen(false)}>
            <section
              className={styles.actionModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="skill-use-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.actionModalHeader}>
                <h2 id="skill-use-title" className={styles.actionModalTitle}>
                  Usar habilidade
                </h2>
                <button type="button" className={styles.closeChatButton} onClick={() => setIsSkillModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              {isLoadingCharacterAbilities ? (
                <p className={styles.emptyState}>Carregando habilidades...</p>
              ) : characterAbilities.length === 0 ? (
                <p className={styles.emptyState}>Esse personagem ainda nao tem habilidades para usar.</p>
              ) : (
                <div className={styles.skillPickerList}>
                  {characterAbilities.map((ability) => {
                    const primaryTag = ability.skillTags[0]
                    const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
                    const abilityName = ability.levelName ?? ability.skillName

                    return (
                      <article key={`${ability.skillId}:${ability.levelNumber}`} className={styles.skillPickerCard}>
                        <button
                          type="button"
                          className={styles.skillPickerMain}
                          onClick={() => {
                            void openLatestAbilityDetails({
                              ability,
                              mode: "use",
                              characterId: selectedCharacter?.id ?? null,
                            })
                          }}
                        >
                          <strong
                            className={styles.skillPickerName}
                            style={
                              tagMeta
                                ? ({
                                    "--skill-action-name-color": tagMeta.text,
                                    "--skill-action-name-bg": tagMeta.bg,
                                    "--skill-action-name-border": tagMeta.border,
                                  } as CSSProperties)
                                : undefined
                            }
                          >
                            {abilityName}
                          </strong>
                          <small className={styles.skillPickerMeta}>
                            {toActionTypeLabel(ability.skillActionType) ?? "Habilidade"}
                          </small>
                        </button>
                        <button
                          type="button"
                          className={styles.skillInfoButton}
                          onClick={() => {
                            void openLatestAbilityDetails({
                              ability,
                              mode: "view",
                              characterId: selectedCharacter?.id ?? null,
                            })
                          }}
                          aria-label="Ver detalhes da habilidade"
                        >
                          <Info size={16} />
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {isDiceModalOpen ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={closeDiceModal}>
            <section
              className={styles.actionModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dice-roll-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.actionModalHeader}>
                <h2 id="dice-roll-title" className={styles.actionModalTitle}>
                  Girar dado
                </h2>
                <div className={styles.actionModalControls}>
                  <button
                    type="button"
                    className={styles.addDiceButton}
                    onClick={() => {
                      setDicePreviewGroups(null)
                      setDiceEntries((currentEntries) => [
                        ...currentEntries,
                        { diceCount: "1", diceSides: "20" },
                      ])
                    }}
                  >
                    <Plus size={16} />
                  </button>
                  <button type="button" className={styles.closeChatButton} onClick={closeDiceModal}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.diceFields}>
                {diceEntries.map((entry, index) => (
                  <div key={`dice-entry-${index}`} className={styles.diceEntryRow}>
                    <label className={styles.diceField}>
                      <span>Numero de dados</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={entry.diceCount}
                        onChange={(event) =>
                          (setDicePreviewGroups(null),
                          setDiceEntries((currentEntries) =>
                            currentEntries.map((currentEntry, currentIndex) =>
                              currentIndex === index
                                ? { ...currentEntry, diceCount: event.target.value }
                                : currentEntry,
                            ),
                          ))
                        }
                      />
                    </label>

                    <label className={styles.diceField}>
                      <span>Lados do dado</span>
                      <input
                        type="number"
                        min={2}
                        max={100}
                        value={entry.diceSides}
                        onChange={(event) =>
                          (setDicePreviewGroups(null),
                          setDiceEntries((currentEntries) =>
                            currentEntries.map((currentEntry, currentIndex) =>
                              currentIndex === index
                                ? { ...currentEntry, diceSides: event.target.value }
                                : currentEntry,
                            ),
                          ))
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>

              {room.isOwner && dicePreviewGroups ? (
                <div className={styles.dicePreview}>
                  <div className={styles.dicePreviewHeader}>
                    <strong>Resultado antes de mostrar</strong>
                    <small>Voce pode ajustar os valores abaixo.</small>
                  </div>

                  <div className={styles.dicePreviewGroups}>
                    {dicePreviewGroups.map((group, groupIndex) => (
                      <div key={`preview-group-${groupIndex}`} className={styles.dicePreviewGroup}>
                        <p className={styles.dicePreviewLabel}>
                          {group.diceCount}d{group.diceSides}
                        </p>
                        <div className={styles.dicePreviewResults}>
                          {group.results.map((result, resultIndex) => (
                            <input
                              key={`preview-result-${groupIndex}-${resultIndex}`}
                              type="number"
                              min={1}
                              max={group.diceSides}
                              value={result}
                              onChange={(event) =>
                                setDicePreviewGroups((currentGroups) =>
                                  currentGroups?.map((currentGroup, currentGroupIndex) =>
                                    currentGroupIndex === groupIndex
                                      ? {
                                          ...currentGroup,
                                          results: currentGroup.results.map((currentResult, currentResultIndex) =>
                                            currentResultIndex === resultIndex
                                              ? event.target.value
                                              : currentResult,
                                          ),
                                        }
                                      : currentGroup,
                                  ) ?? null,
                                )
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                className={styles.rollSubmitButton}
                onClick={() => {
                  if (room.isOwner && dicePreviewGroups) {
                    void submitDiceRoll(dicePreviewGroups)
                    return
                  }

                  void handleDiceRoll()
                }}
                disabled={isBusy}
              >
                {room.isOwner && dicePreviewGroups ? "Mostrar resultado" : "Girar"}
              </button>
            </section>
          </div>
        ) : null}

        {selectedAbilityDetails ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={() => {
              setSelectedAbilityDetails(null)
              setSelectedAbilityDetailsMode("view")
            }}
          >
            <section
              className={styles.skillDetailsModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="skill-details-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.skillDetailsTopBar}>
                <button
                  type="button"
                  className={styles.closeChatButton}
                  onClick={() => {
                    setSelectedAbilityDetails(null)
                    setSelectedAbilityDetailsMode("view")
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {renderAbilityTaggedCard(selectedAbilityDetails)}

              {selectedAbilityDetailsMode === "use" ? (
                <div className={styles.skillDetailsActions}>
                  <button
                    type="button"
                    className={styles.rollSubmitButton}
                    onClick={() => {
                      void handleUseAbility(selectedAbilityDetails)
                    }}
                    disabled={isBusy}
                  >
                    Usar habilidade
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  )
}
