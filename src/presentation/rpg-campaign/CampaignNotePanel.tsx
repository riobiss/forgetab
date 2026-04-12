"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { SendHorizontal } from "lucide-react"
import chatStyles from "./CampaignChatPanel.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type CampaignNoteMessage = {
  id: string
  content: string
  createdAt: Date
}

type StoredCampaignNoteMessage = Omit<CampaignNoteMessage, "createdAt"> & {
  createdAt: string
}

type Props = {
  campaignId: string
  viewerUserId: string
  formatTime: (date: Date) => string
}

function createNoteStorageKey(campaignId: string, viewerUserId: string) {
  return `forgetab:campaign-note:${campaignId}:${viewerUserId}`
}

function createNoteId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function parseStoredNotes(rawValue: string | null): CampaignNoteMessage[] {
  if (!rawValue) return []

  try {
    const parsedValue = JSON.parse(rawValue) as StoredCampaignNoteMessage[]
    if (!Array.isArray(parsedValue)) return []

    return parsedValue
      .filter((message) => typeof message.id === "string" && typeof message.content === "string")
      .map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: new Date(message.createdAt),
      }))
      .filter((message) => !Number.isNaN(message.createdAt.getTime()))
  } catch {
    return []
  }
}

export function CampaignNotePanel({ campaignId, viewerUserId, formatTime }: Props) {
  const [notes, setNotes] = useState<CampaignNoteMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null)
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const storageKey = useMemo(() => createNoteStorageKey(campaignId, viewerUserId), [campaignId, viewerUserId])

  useEffect(() => {
    setNotes(parseStoredNotes(window.localStorage.getItem(storageKey)))
    setLoadedStorageKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(
        notes.map((note) => ({
          ...note,
          createdAt: note.createdAt.toISOString(),
        })),
      ),
    )
  }, [loadedStorageKey, notes, storageKey])

  useEffect(() => {
    const textarea = composerTextareaRef.current
    if (!textarea) return

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [draft])

  function submitNote() {
    const trimmedDraft = draft.trim()
    if (!trimmedDraft) return

    setNotes((currentNotes) => [
      ...currentNotes,
      {
        id: createNoteId(),
        content: trimmedDraft,
        createdAt: new Date(),
      },
    ])
    setDraft("")
  }

  return (
    <div className={chatStyles.chatConversation}>
      <div className={chatStyles.conversationHeader}>
        <div className={chatStyles.conversationIdentity}>
          <h2 className={chatStyles.conversationTitle}>Nota</h2>
        </div>
      </div>

      <div className={chatStyles.stream}>
        {notes.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma nota escrita ainda.</p>
        ) : (
          notes.map((note) => (
            <article key={note.id} className={`${chatStyles.chatBubble} ${chatStyles.chatBubbleOwn}`}>
              <p className={chatStyles.chatBubbleContent}>
                {note.content}
                <span className={chatStyles.chatBubbleTime}>{formatTime(note.createdAt)}</span>
              </p>
            </article>
          ))
        )}
      </div>

      <form
        className={chatStyles.composer}
        onSubmit={(event) => {
          event.preventDefault()
          submitNote()
        }}
      >
        <textarea
          ref={composerTextareaRef}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submitNote()
            }
          }}
          placeholder="Escreva uma nota"
        />
        <button type="submit" className={styles.submitButton} aria-label="Salvar nota">
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  )
}
