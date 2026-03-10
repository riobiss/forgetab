"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Backpack, ChevronDown, List, Minus, Plus, Sparkles, Users } from "lucide-react"
import styles from "../RpgDashboardPage.module.css"

type AcceptedMember = {
  id: string
  userId: string
  userUsername: string
  userName: string
  role: "member" | "moderator"
}

type CharacterSummary = {
  id: string
  name: string
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  createdByUserId?: string | null
}

type CharactersPayload = {
  characters?: CharacterSummary[]
  message?: string
}

type ClassSummary = {
  key: string
  label: string
}

type ClassesPayload = {
  classes?: ClassSummary[]
  message?: string
}

type RpgPayload = {
  rpg?: {
    costResourceName?: string
  }
  message?: string
}

type GrantPointsPayload = {
  success?: boolean
  message?: string
  remainingPoints?: number
}

type GrantXpPayload = {
  success?: boolean
  message?: string
  progressionCurrent?: number
  progressionLabel?: string
  progressionRequired?: number
}

type Props = {
  rpgId: string
  members: AcceptedMember[]
  compact?: boolean
  usersCanManageOwnXp?: boolean
  allowSkillPointDistribution?: boolean
}

type ActionMode = "none" | "points" | "xp"

export default function MembersList({
  rpgId,
  members,
  compact = false,
  usersCanManageOwnXp = true,
  allowSkillPointDistribution = true,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expellingId, setExpellingId] = useState<string | null>(null)
  const [togglingModeratorId, setTogglingModeratorId] = useState<string | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionMode, setActionMode] = useState<ActionMode>("none")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [amountInput, setAmountInput] = useState("1")
  const [playerByUserId, setPlayerByUserId] = useState<
    Record<string, { characterId: string; classLabel: string }>
  >({})
  const [loadingActionKey, setLoadingActionKey] = useState("")
  const membersCount = members.length
  const selectedAmount = useMemo(() => {
    const parsed = Number(amountInput)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null
    }
    return parsed
  }, [amountInput])

  async function expelMember(memberId: string) {
    if (expellingId) return
    const confirmed = window.confirm("Deseja realmente expulsar este membro?")
    if (!confirmed) {
      return
    }

    setExpellingId(memberId)

    try {
      const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        window.alert(payload.message ?? "Nao foi possivel expulsar membro.")
        return
      }

      router.refresh()
    } catch {
      window.alert("Erro de conexao ao expulsar membro.")
    } finally {
      setExpellingId(null)
    }
  }

  async function toggleModerator(memberId: string) {
    if (togglingModeratorId || expellingId) return

    setTogglingModeratorId(memberId)

    try {
      const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleModerator" }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        window.alert(payload.message ?? "Nao foi possivel atualizar moderador.")
        return
      }

      router.refresh()
    } catch {
      window.alert("Erro de conexao ao atualizar moderador.")
    } finally {
      setTogglingModeratorId(null)
    }
  }

  async function loadActionData() {
    setActionLoading(true)
    setActionError("")
    setActionMessage("")
    try {
      const [charactersResponse, classesResponse, rpgResponse] = await Promise.all([
        fetch(`/api/rpg/${rpgId}/characters`),
        fetch(`/api/rpg/${rpgId}/classes`),
        fetch(`/api/rpg/${rpgId}`),
      ])
      const charactersPayload = (await charactersResponse.json()) as CharactersPayload
      const classesPayload = (await classesResponse.json()) as ClassesPayload
      const rpgPayload = (await rpgResponse.json()) as RpgPayload

      if (!charactersResponse.ok) {
        setActionError(charactersPayload.message ?? "Nao foi possivel carregar personagens.")
        return
      }
      if (!classesResponse.ok) {
        setActionError(classesPayload.message ?? "Nao foi possivel carregar classes.")
        return
      }
      if (!rpgResponse.ok) {
        setActionError(rpgPayload.message ?? "Nao foi possivel carregar configuracoes do RPG.")
        return
      }

      const classLabelByKey = new Map((classesPayload.classes ?? []).map((item) => [item.key, item.label]))
      const nextPlayerByUserId = (charactersPayload.characters ?? [])
        .filter((item) => item.characterType === "player")
        .reduce<Record<string, { characterId: string; classLabel: string }>>((acc, item) => {
          const userId = item.createdByUserId?.trim()
          if (!userId) return acc
          acc[userId] = {
            characterId: item.id,
            classLabel: item.classKey ? classLabelByKey.get(item.classKey) ?? item.classKey : "Sem classe",
          }
          return acc
        }, {})

      setPlayerByUserId(nextPlayerByUserId)
      setCostResourceName(rpgPayload.rpg?.costResourceName?.trim() || "Skill Points")
      setAmountInput("1")
    } catch {
      setActionError("Erro de conexao ao carregar dados de distribuicao.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleGrantPoints(member: AcceptedMember, direction: 1 | -1) {
    if (!selectedAmount) {
      setActionError("Informe uma quantidade valida (inteiro maior que zero).")
      return
    }

    const player = playerByUserId[member.userId]
    if (!player) {
      setActionError(`${member.userName} nao possui personagem player vinculado.`)
      return
    }

    setLoadingActionKey(`${member.id}:${direction}`)
    setActionError("")
    setActionMessage("")

    try {
      const response = await fetch(`/api/characters/${player.characterId}/grant-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount * direction }),
      })
      const payload = (await response.json()) as GrantPointsPayload
      if (!response.ok || !payload.success) {
        setActionError(payload.message ?? "Nao foi possivel atualizar pontos.")
        return
      }

      const remaining =
        typeof payload.remainingPoints === "number" ? ` (${payload.remainingPoints})` : ""
      setActionMessage(
        direction > 0
          ? `${member.userName} recebeu ${selectedAmount} ${costResourceName}.${remaining}`
          : `${member.userName} perdeu ${selectedAmount} ${costResourceName}.${remaining}`,
      )
    } catch {
      setActionError("Erro de conexao ao atualizar pontos.")
    } finally {
      setLoadingActionKey("")
    }
  }

  async function handleGrantXp(member: AcceptedMember) {
    if (!selectedAmount) {
      setActionError("Informe uma quantidade valida (inteiro maior que zero).")
      return
    }

    const player = playerByUserId[member.userId]
    if (!player) {
      setActionError(`${member.userName} nao possui personagem player vinculado.`)
      return
    }

    setLoadingActionKey(`${member.id}:xp`)
    setActionError("")
    setActionMessage("")

    try {
      const response = await fetch(`/api/characters/${player.characterId}/grant-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      })
      const payload = (await response.json()) as GrantXpPayload
      if (!response.ok || !payload.success) {
        setActionError(payload.message ?? "Nao foi possivel conceder XP.")
        return
      }

      const progressionLabel = payload.progressionLabel ?? "Etapa"
      const progressionCurrent = payload.progressionCurrent ?? 0
      const progressionRequired = payload.progressionRequired ?? 0
      setActionMessage(
        `${member.userName} recebeu ${selectedAmount} XP. Agora esta em ${progressionLabel} (${progressionCurrent}/${progressionRequired}).`,
      )
      router.refresh()
    } catch {
      setActionError("Erro de conexao ao conceder XP.")
    } finally {
      setLoadingActionKey("")
    }
  }

  return (
    <section
      className={`${styles.membersWrapper} ${compact ? styles.membersWrapperCompact : ""}`}
    >
      <button
        type="button"
        className={`${styles.membersTrigger} ${compact ? styles.membersTriggerCompact : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Membros"
        title="Membros"
      >
        <span className={styles.membersTriggerLeft}>
          <Users size={16} />
          {!compact ? <span>Membros</span> : null}
        </span>
        <span className={styles.membersTriggerRight}>
          <span className={styles.membersBadge}>{membersCount}</span>
          {!compact ? (
            <ChevronDown size={16} className={isOpen ? styles.membersChevronOpen : ""} />
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <div
          className={`${styles.membersPanel} ${compact ? styles.membersPanelPopover : ""}`}
        >
          <div className={styles.membersHeader}>
            <h3>Todos os Membros</h3>
            <div className={styles.membersHeaderActions}>
              <button
                type="button"
                className={styles.membersListActionButton}
                onClick={() => setActionsOpen((prev) => !prev)}
                aria-expanded={actionsOpen}
                aria-label="Abrir opcoes de membros"
                title="Acoes de membros"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {actionsOpen ? (
            <div className={styles.membersActionMenu}>
              {allowSkillPointDistribution ? (
                <button
                  type="button"
                  className={styles.membersActionOption}
                  onClick={() => {
                    setActionMode("points")
                    void loadActionData()
                  }}
                >
                  <Backpack size={14} />
                  Distribuir pontos de habilidade
                </button>
              ) : null}
              <button
                type="button"
                className={styles.membersActionOption}
                onClick={() => {
                  setActionMode("xp")
                  void loadActionData()
                }}
              >
                <Sparkles size={14} />
                Dar XP para usuario
              </button>
            </div>
          ) : null}

          {!actionsOpen && membersCount === 0 ? (
            <p>Nenhum membro aceito ate o momento.</p>
          ) : null}

          {!actionsOpen && membersCount > 0 ? (
            <div className={styles.membersList}>
              {members.map((member) => (
                <article key={member.id} className={styles.membersCard}>
                  <div>
                    <strong>@{member.userUsername}</strong>
                    <small>{member.userName}</small>
                  </div>
                  <div className={styles.memberActions}>
                    <button
                      type="button"
                      className={`${styles.moderatorToggleButton} ${
                        member.role === "moderator" ? styles.moderatorToggleButtonActive : ""
                      }`}
                      onClick={() => toggleModerator(member.id)}
                      disabled={togglingModeratorId === member.id || expellingId === member.id}
                    >
                      {togglingModeratorId === member.id ? "Salvando..." : "Moderador"}
                    </button>
                    <button
                      type="button"
                      className={styles.expelMemberButton}
                      onClick={() => expelMember(member.id)}
                      disabled={expellingId === member.id || togglingModeratorId === member.id}
                    >
                      {expellingId === member.id ? "Expulsando..." : "Expulsar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {actionMode !== "none" ? (
            <div className={styles.memberActionPanel}>
              <label className={styles.memberActionAmountField}>
                <span>Quantidade</span>
                <input
                  type="number"
                  onWheel={(event) => event.currentTarget.blur()}
                  min={1}
                  step={1}
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  disabled={loadingActionKey.length > 0}
                />
              </label>

              {actionMode === "xp" && usersCanManageOwnXp ? (
                <p className={styles.memberActionInfo}>
                  Permissao atual: usuarios podem gerenciar o proprio XP.
                </p>
              ) : null}
              {actionLoading ? <p>Carregando dados...</p> : null}

              {!actionLoading
                ? members.map((member) => {
                    const loadingAny = loadingActionKey.length > 0
                    const loadingAdd = loadingActionKey === `${member.id}:1`
                    const loadingRemove = loadingActionKey === `${member.id}:-1`
                    const player = playerByUserId[member.userId]

                    return (
                      <div key={`${member.id}:${actionMode}`} className={styles.memberActionPlayerRow}>
                        <div>
                          <strong>@{member.userUsername}</strong>
                          <small>
                            {player ? `Classe: ${player.classLabel}` : "Sem personagem player vinculado"}
                          </small>
                        </div>
                        {actionMode === "points" ? (
                          <div className={styles.memberActionButtons}>
                            <button
                              type="button"
                              className={styles.memberActionButton}
                              onClick={() => void handleGrantPoints(member, -1)}
                              disabled={loadingAny || !selectedAmount || !player}
                              title={`Remover ${costResourceName}`}
                              aria-label={`Remover ${costResourceName}`}
                            >
                              {loadingRemove ? "..." : <Minus size={13} />}
                            </button>
                            <button
                              type="button"
                              className={styles.memberActionButton}
                              onClick={() => void handleGrantPoints(member, 1)}
                              disabled={loadingAny || !selectedAmount || !player}
                              title={`Adicionar ${costResourceName}`}
                              aria-label={`Adicionar ${costResourceName}`}
                            >
                              {loadingAdd ? "..." : <Plus size={13} />}
                            </button>
                          </div>
                        ) : (
                          <div className={styles.memberActionButtons}>
                            <button
                              type="button"
                              className={styles.memberActionButton}
                              onClick={() => void handleGrantXp(member)}
                              disabled={!selectedAmount || !player || loadingActionKey.length > 0}
                              title="Dar XP para usuario"
                              aria-label="Dar XP para usuario"
                            >
                              {loadingActionKey === `${member.id}:xp` ? "..." : "Dar XP"}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                : null}

              {actionError ? <p className={styles.memberActionError}>{actionError}</p> : null}
              {actionMessage ? <p className={styles.memberActionSuccess}>{actionMessage}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
