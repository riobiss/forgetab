"use client"

import { useState } from "react"
import { Backpack, ChevronDown, List, Minus, Plus, Sparkles, Users } from "lucide-react"
import styles from "../RpgDashboardPage.module.css"
import { createRpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import { useMembersList } from "@/presentation/rpg-dashboard/hooks/useMembersList"

type AcceptedMember = {
  id: string
  userId: string
  userUsername: string
  userName: string
  role: "member" | "moderator"
}

type Props = {
  rpgId: string
  members: AcceptedMember[]
  compact?: boolean
  usersCanManageOwnXp?: boolean
  allowSkillPointDistribution?: boolean
}

const dashboardDeps = createRpgDashboardDependencies()

export default function MembersList({
  rpgId,
  members,
  compact = false,
  usersCanManageOwnXp = true,
  allowSkillPointDistribution = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    expellingId,
    togglingModeratorId,
    actionsOpen,
    setActionsOpen,
    actionMode,
    setActionMode,
    actionLoading,
    actionError,
    actionMessage,
    costResourceName,
    amountInput,
    setAmountInput,
    playerByUserId,
    loadingActionKey,
    selectedAmount,
    expelMember,
    toggleModerator,
    loadActionData,
    handleGrantPoints,
    handleGrantXp,
  } = useMembersList(dashboardDeps, { rpgId })
  const membersCount = members.length

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
                      onClick={async () => {
                        const confirmed = window.confirm("Deseja realmente expulsar este membro?")
                        if (!confirmed) return
                        const success = await expelMember(member.id)
                        if (!success) {
                          window.alert("Nao foi possivel expulsar membro.")
                        }
                      }}
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
