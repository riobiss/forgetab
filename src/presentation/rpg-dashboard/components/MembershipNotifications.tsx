"use client"

import { useState } from "react"
import styles from "../RpgDashboardPage.module.css"
import { formatDateInBrasilia } from "@/lib/date"
import { Bell, ChevronDown } from "lucide-react"
import { createRpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import { useMembershipNotifications } from "@/presentation/rpg-dashboard/hooks/useMembershipNotifications"

type PendingRequest = {
  id: string
  userUsername: string
  userName: string
  requestedAt: string
}

type PendingCharacterRequest = {
  id: string
  userUsername: string
  userName: string
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

const dashboardDeps = createRpgDashboardDependencies()

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
  const [isOpen, setIsOpen] = useState(false)
  const {
    loadingRequest,
    processingId,
    message,
    error,
    requestToJoin,
    processRequest,
    processCharacterRequest,
  } = useMembershipNotifications(dashboardDeps, { rpgId })

  const notificationsCount = isOwner
    ? pendingRequests.length + pendingCharacterRequests.length
    : 0

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
                        <strong>@{request.userUsername}</strong>
                        <small>{request.userName}</small>
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
                        <strong>@{request.userUsername}</strong>
                        <small>{request.userName}</small>
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
