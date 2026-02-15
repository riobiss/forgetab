"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import styles from "../page.module.css"

type PendingRequest = {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedAt: string
}

type Payload = {
  isOwner: boolean
  pendingRequests?: PendingRequest[]
  canRequest?: boolean
  canCreate?: boolean
  requestStatus?: "pending" | "accepted" | "rejected" | null
  message?: string
}

type Props = {
  rpgId: string
  isOwner: boolean
  isAcceptedMember: boolean
  ownCharacterId: string | null
}

export default function CharacterCreationPermission({
  rpgId,
  isOwner,
  isAcceptedMember,
  ownCharacterId,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [requestStatus, setRequestStatus] = useState<
    "pending" | "accepted" | "rejected" | null
  >(null)
  const [canRequest, setCanRequest] = useState(false)
  const [canCreate, setCanCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/rpg/${rpgId}/character-requests`)
      const payload = (await response.json()) as Payload

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel carregar permissoes de personagem.")
        return
      }

      setPendingRequests(payload.pendingRequests ?? [])
      setRequestStatus(payload.requestStatus ?? null)
      setCanRequest(Boolean(payload.canRequest))
      setCanCreate(Boolean(payload.canCreate))
    } catch {
      setError("Erro de conexao ao carregar permissoes de personagem.")
    } finally {
      setLoading(false)
    }
  }, [rpgId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleRequestPermission() {
    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/rpg/${rpgId}/character-requests`, {
        method: "POST",
      })
      const payload = (await response.json()) as Payload

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel solicitar permissao.")
        return
      }

      await load()
    } catch {
      setError("Erro de conexao ao solicitar permissao.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleModerateRequest(requestId: string, action: "accept" | "reject") {
    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/rpg/${rpgId}/character-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const payload = (await response.json()) as Payload

      if (!response.ok) {
        setError(payload.message ?? "Nao foi possivel processar solicitacao.")
        return
      }

      await load()
    } catch {
      setError("Erro de conexao ao processar solicitacao.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className={styles.permissionInfo}>Carregando permissoes de criacao...</p>
  }

  return (
    <section className={styles.permissionCard}>
      {isOwner ? (
        <>
          <h3>Solicitacoes de criacao de personagem</h3>
          {pendingRequests.length === 0 ? (
            <p className={styles.permissionInfo}>Nenhuma solicitacao pendente.</p>
          ) : (
            <ul className={styles.requestList}>
              {pendingRequests.map((request) => (
                <li key={request.id} className={styles.requestItem}>
                  <div>
                    <strong>{request.userName}</strong>
                    <p>{request.userEmail}</p>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      type="button"
                      onClick={() => handleModerateRequest(request.id, "accept")}
                      disabled={submitting}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      onClick={() => handleModerateRequest(request.id, "reject")}
                      disabled={submitting}
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : ownCharacterId ? (
        <>
          <p className={styles.permissionInfo}>Seu personagem ja foi criado.</p>
          <Link
            className={styles.secondaryAction}
            href={`/rpg/${rpgId}/characters/novo?characterId=${ownCharacterId}`}
          >
            Editar meu personagem
          </Link>
        </>
      ) : !isAcceptedMember ? (
        <p className={styles.permissionInfo}>
          Voce precisa ser membro aceito para solicitar criacao de personagem.
        </p>
      ) : canCreate || requestStatus === "accepted" ? (
        <>
          <p className={styles.permissionInfo}>Sua permissao foi aprovada pelo mestre.</p>
          <Link className={styles.primaryAction} href={`/rpg/${rpgId}/characters/novo`}>
            Criar personagem
          </Link>
        </>
      ) : requestStatus === "pending" ? (
        <p className={styles.permissionInfo}>
          Sua solicitacao de criacao esta pendente de aprovacao do mestre.
        </p>
      ) : (
        <>
          <p className={styles.permissionInfo}>
            Para criar personagem, envie uma solicitacao para o mestre.
          </p>
          <button
            type="button"
            className={styles.primaryActionButton}
            onClick={handleRequestPermission}
            disabled={submitting || !canRequest}
          >
            {submitting ? "Enviando..." : "Solicitar permissao"}
          </button>
        </>
      )}

      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  )
}
