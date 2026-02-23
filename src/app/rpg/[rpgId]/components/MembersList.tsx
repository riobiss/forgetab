"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, Users } from "lucide-react"
import styles from "../page.module.css"

type AcceptedMember = {
  id: string
  userUsername: string
  userName: string
}

type Props = {
  rpgId: string
  members: AcceptedMember[]
  compact?: boolean
}

export default function MembersList({ rpgId, members, compact = false }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [expellingId, setExpellingId] = useState<string | null>(null)
  const membersCount = members.length

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
          <h3>Todos os Membros</h3>
          {membersCount === 0 ? (
            <p>Nenhum membro aceito ate o momento.</p>
          ) : (
            <div className={styles.membersList}>
              {members.map((member) => (
                <article key={member.id} className={styles.membersCard}>
                  <div>
                    <strong>@{member.userUsername}</strong>
                    <small>{member.userName}</small>
                  </div>
                  <button
                    type="button"
                    className={styles.expelMemberButton}
                    onClick={() => expelMember(member.id)}
                    disabled={expellingId === member.id}
                  >
                    {expellingId === member.id ? "Expulsando..." : "Expulsar"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
