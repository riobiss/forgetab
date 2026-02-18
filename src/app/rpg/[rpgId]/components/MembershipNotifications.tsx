"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import styles from "../page.module.css"
import { formatDateInBrasilia } from "@/lib/date"
import { Bell, ChevronDown } from "lucide-react"

type PendingRequest = {
  id: string
  userName: string
  userEmail: string
  requestedAt: string
}

type PendingCharacterRequest = {
  id: string
  userName: string
  userEmail: string
  requestedAt: string
}

type Props = {
  rpgId: string
  isOwner: boolean
  isAuthenticated: boolean
  membershipStatus: "pending" | "accepted" | "rejected" | null
  pendingRequests: PendingRequest[]
  pendingCharacterRequests: PendingCharacterRequest[]
  compact?: boolean
  simpleJoin?: boolean
}

export default function MembershipNotifications({
  rpgId,
  isOwner,
  isAuthenticated,
  membershipStatus,
  pendingRequests,
  pendingCharacterRequests,
  compact = false,
  simpleJoin = false,
}: Props) {
  const router = useRouter()
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const notificationsCount = isOwner
    ? pendingRequests.length + pendingCharacterRequests.length
    : 0

  async function requestToJoin() {
    if (loadingRequest) return
    setLoadingRequest(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/members`, {
        method: "POST",
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel enviar a solicitacao.")
        return
      }

      setMessage(payload.message ?? "Solicitacao enviada.")
      router.refresh()
    } catch {
      setError("Erro de conexao ao solicitar participacao.")
    } finally {
      setLoadingRequest(false)
    }
  }

  async function processRequest(memberId: string, action: "accept" | "reject") {
    if (processingId) return
    setProcessingId(memberId)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel processar solicitacao.")
        return
      }

      setMessage(payload.message ?? "Solicitacao processada.")
      router.refresh()
    } catch {
      setError("Erro de conexao ao processar solicitacao.")
    } finally {
      setProcessingId(null)
    }
  }

  async function processCharacterRequest(requestId: string, action: "accept" | "reject") {
    if (processingId) return
    setProcessingId(requestId)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/character-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel processar solicitacao de personagem.")
        return
      }

      setMessage(payload.message ?? "Solicitacao de personagem processada.")
      router.refresh()
    } catch {
      setError("Erro de conexao ao processar solicitacao de personagem.")
    } finally {
      setProcessingId(null)
    }
  }

  if (simpleJoin) {
    return (
      <section className={styles.joinRequestBox}>
        {!isAuthenticated ? (
          <p>Faca login para solicitar participacao nesta campanha.</p>
        ) : membershipStatus === "pending" ? (
          <p>Sua solicitacao foi enviada e aguarda aprovacao do mestre.</p>
        ) : membershipStatus === "accepted" ? (
          <p>Voce ja e membro deste RPG.</p>
        ) : (
          <button type="button" onClick={requestToJoin} disabled={loadingRequest}>
            {loadingRequest ? "Enviando..." : "Pedir pra entrar"}
          </button>
        )}

        {error ? <p className={styles.noticeError}>{error}</p> : null}
        {message ? <p className={styles.noticeSuccess}>{message}</p> : null}
      </section>
    )
  }

  return (
    <section
      className={`${styles.notificationWrapper} ${compact ? styles.notificationWrapperCompact : ""}`}
    >
      <button
        type="button"
        className={`${styles.notificationTrigger} ${compact ? styles.notificationTriggerCompact : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Notificacoes"
        title="Notificacoes"
      >
        <span className={styles.notificationTriggerLeft}>
          <Bell size={16} />
          {!compact ? <span>Notificacoes</span> : null}
        </span>
        <span className={styles.notificationTriggerRight}>
          {notificationsCount > 0 ? (
            <span className={styles.notificationBadge}>{notificationsCount}</span>
          ) : null}
          {!compact ? (
            <ChevronDown size={16} className={isOpen ? styles.notificationChevronOpen : ""} />
          ) : null}
        </span>
      </button>

      {isOpen ? (
        <div
          className={`${styles.memberNotice} ${compact ? styles.memberNoticePopover : ""}`}
        >
          {isOwner ? (
            <>
              <h3>Notificacoes do GM</h3>
              {pendingRequests.length === 0 && pendingCharacterRequests.length === 0 ? (
                <p>Nenhum pedido pendente.</p>
              ) : (
                <div className={styles.noticeList}>
                  {pendingRequests.map((request) => (
                    <article key={request.id} className={styles.noticeCard}>
                      <div>
                        <strong>{request.userName}</strong>
                        <small>{request.userEmail}</small>
                        <small>
                          Solicitou em {formatDateInBrasilia(request.requestedAt)}
                        </small>
                      </div>
                      <div className={styles.noticeActions}>
                        <button
                          type="button"
                          onClick={() => processRequest(request.id, "accept")}
                          disabled={processingId === request.id}
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={() => processRequest(request.id, "reject")}
                          disabled={processingId === request.id}
                        >
                          Recusar
                        </button>
                      </div>
                    </article>
                  ))}

                  {pendingCharacterRequests.map((request) => (
                    <article key={request.id} className={styles.noticeCard}>
                      <div>
                        <strong>{request.userName}</strong>
                        <small>{request.userEmail}</small>
                        <small>
                          Solicitou criacao de personagem em{" "}
                          {formatDateInBrasilia(request.requestedAt)}
                        </small>
                      </div>
                      <div className={styles.noticeActions}>
                        <button
                          type="button"
                          onClick={() => processCharacterRequest(request.id, "accept")}
                          disabled={processingId === request.id}
                        >
                          Aprovar personagem
                        </button>
                        <button
                          type="button"
                          onClick={() => processCharacterRequest(request.id, "reject")}
                          disabled={processingId === request.id}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3>Participacao no RPG</h3>
              {!isAuthenticated ? (
                <p>Faca login para solicitar participacao nesta campanha.</p>
              ) : membershipStatus === "accepted" ? (
                <p>Voce ja e membro deste RPG.</p>
              ) : membershipStatus === "pending" ? (
                <p>Sua solicitacao foi enviada e aguarda aprovacao do mestre.</p>
              ) : (
                <div className={styles.joinActions}>
                  <p>Solicite entrada para participar desta campanha.</p>
                  <button
                    type="button"
                    onClick={requestToJoin}
                    disabled={loadingRequest}
                  >
                    {loadingRequest ? "Enviando..." : "Solicitar participacao"}
                  </button>
                </div>
              )}
            </>
          )}

          {error ? <p className={styles.noticeError}>{error}</p> : null}
          {message ? <p className={styles.noticeSuccess}>{message}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
