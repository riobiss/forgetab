"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import styles from "../page.module.css"

type PendingRequest = {
  id: string
  userName: string
  userEmail: string
  requestedAt: string
}

type AcceptedMember = {
  id: string
  userName: string
  userEmail: string
}

type Props = {
  rpgId: string
  isOwner: boolean
  isAuthenticated: boolean
  membershipStatus: "pending" | "accepted" | "rejected" | null
  pendingRequests: PendingRequest[]
  acceptedMembers: AcceptedMember[]
}

export default function MembershipNotifications({
  rpgId,
  isOwner,
  isAuthenticated,
  membershipStatus,
  pendingRequests,
  acceptedMembers,
}: Props) {
  const router = useRouter()
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expellingId, setExpellingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function requestToJoin() {
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

  async function expelMember(memberId: string) {
    const confirmed = window.confirm("Deseja realmente expulsar este membro?")

    if (!confirmed) {
      return
    }

    setExpellingId(memberId)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel expulsar membro.")
        return
      }

      setMessage(payload.message ?? "Membro expulso.")
      router.refresh()
    } catch {
      setError("Erro de conexao ao expulsar membro.")
    } finally {
      setExpellingId(null)
    }
  }

  return (
    <section className={styles.memberNotice}>
      {isOwner ? (
        <>
          <h3>Notificacoes de Membros</h3>
          {pendingRequests.length === 0 ? (
            <p>Nenhuma solicitacao pendente.</p>
          ) : (
            <div className={styles.noticeList}>
              {pendingRequests.map((request) => (
                <article key={request.id} className={styles.noticeCard}>
                  <div>
                    <strong>{request.userName}</strong>
                    <small>{request.userEmail}</small>
                    <small>
                      Solicitou em {new Date(request.requestedAt).toLocaleDateString("pt-BR")}
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
            </div>
          )}

          <h3 className={styles.membersTitle}>Membros atuais</h3>
          {acceptedMembers.length === 0 ? (
            <p>Nenhum membro aceito ate o momento.</p>
          ) : (
            <div className={styles.noticeList}>
              {acceptedMembers.map((member) => (
                <article key={member.id} className={styles.noticeCard}>
                  <div>
                    <strong>{member.userName}</strong>
                    <small>{member.userEmail}</small>
                  </div>
                  <div className={styles.noticeActions}>
                    <button
                      type="button"
                      className={styles.expelButton}
                      onClick={() => expelMember(member.id)}
                      disabled={expellingId === member.id}
                    >
                      {expellingId === member.id ? "Expulsando..." : "Expulsar"}
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
    </section>
  )
}
