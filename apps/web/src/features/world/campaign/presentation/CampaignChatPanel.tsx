"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, SendHorizontal, X } from "lucide-react"
import type { RpgCampaignRoomViewModel } from "@forgetab/world-contracts/campaign"
import { httpRpgCampaignRepository } from "@/features/world/campaign/infrastructure/repositories/httpRpgCampaignRepository"
import chatStyles from "./CampaignChatPanel.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type ChatTarget =
  { type: "campaign" } | { type: "direct"; userId: string } | null
type CampaignRoomMessage = RpgCampaignRoomViewModel["campaignMessages"][number]

type Props = {
  rpgId: string
  room: RpgCampaignRoomViewModel
  isBusy: boolean
  isCampaignEnded: boolean
  formatTime: (date: Date) => string
  onClose: () => void
  runAction: (action: () => Promise<{ message?: string }>) => Promise<boolean>
  appendMessageLocally: (message: CampaignRoomMessage) => void
}

export function CampaignChatPanel({
  rpgId,
  room,
  isBusy,
  isCampaignEnded,
  formatTime,
  onClose,
  runAction,
  appendMessageLocally
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    room.participants[0]?.userId ?? null
  )
  const [selectedChat, setSelectedChat] = useState<ChatTarget>(null)
  const [campaignMessage, setCampaignMessage] = useState("")
  const [directMessage, setDirectMessage] = useState("")
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const availableDirectParticipants = useMemo(
    () =>
      room.participants.filter(
        (participant) => participant.userId !== room.viewerUserId
      ),
    [room.participants, room.viewerUserId]
  )

  const selectedParticipant =
    availableDirectParticipants.find(
      (participant) => participant.userId === selectedUserId
    ) ?? null

  const directThread = useMemo(() => {
    if (!selectedUserId) return []
    return room.directMessages.filter(
      (message) =>
        message.authorId === selectedUserId ||
        message.recipientUserId === selectedUserId
    )
  }, [room.directMessages, selectedUserId])

  const selectedConversationTitle =
    selectedChat?.type === "campaign"
      ? "Chat da campanha"
      : (selectedParticipant?.name ?? "Chat privado")

  useEffect(() => {
    if (
      selectedUserId &&
      availableDirectParticipants.some(
        (participant) => participant.userId === selectedUserId
      )
    ) {
      return
    }

    setSelectedUserId(availableDirectParticipants[0]?.userId ?? null)
  }, [availableDirectParticipants, selectedUserId])

  useEffect(() => {
    const textarea = composerTextareaRef.current
    if (!textarea) return

    textarea.style.height = "0px"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [campaignMessage, directMessage, selectedChat])

  async function submitCurrentMessage() {
    if (selectedChat?.type === "campaign") {
      const trimmedMessage = campaignMessage.trim()
      if (!trimmedMessage) return

      await runAction(async () => {
        const payload = await httpRpgCampaignRepository.sendMessage(
          rpgId,
          room.campaign.id,
          {
            content: trimmedMessage,
            kind: "campaign"
          }
        )
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
      const payload = await httpRpgCampaignRepository.sendMessage(
        rpgId,
        room.campaign.id,
        {
          content: trimmedMessage,
          kind: "direct",
          recipientUserId: selectedParticipant.userId
        }
      )
      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }
      setDirectMessage("")
      return payload
    })
  }

  function renderChatMessage(
    message: CampaignRoomMessage,
    showAuthor: boolean
  ) {
    const isOwnMessage = message.authorId === room.viewerUserId
    const authorLabel = isOwnMessage ? "Voce" : message.authorName

    return (
      <article
        key={message.id}
        className={`${chatStyles.chatBubble} ${isOwnMessage ? chatStyles.chatBubbleOwn : chatStyles.chatBubbleOther}`}
      >
        {showAuthor ? (
          <p className={chatStyles.chatBubbleMeta}>
            <strong>{authorLabel}</strong>{" "}
            {!isOwnMessage ? `@${message.authorUsername}` : null}
          </p>
        ) : null}
        <p className={chatStyles.chatBubbleContent}>
          {message.content}
          <span className={chatStyles.chatBubbleTime}>
            {formatTime(message.createdAt)}
          </span>
        </p>
      </article>
    )
  }

  const isConversationOpen =
    selectedChat?.type === "campaign" ||
    (selectedChat?.type === "direct" && selectedParticipant)

  return (
    <main className={styles.page}>
      <div className={`${styles.container} ${chatStyles.containerChatMode}`}>
        <section
          className={`${styles.panel} ${chatStyles.panelChatMode} ${isConversationOpen ? chatStyles.panelChatConversationMode : ""}`}
        >
          {selectedChat === null ? (
            <div className={chatStyles.chatPanelHeader}>
              <h2 className={styles.sectionTitle}>Chat</h2>
              <button
                type="button"
                className={styles.closeChatButton}
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <div className={chatStyles.chatLayout}>
            {isConversationOpen ? (
              <div className={chatStyles.chatConversation}>
                <div className={chatStyles.conversationHeader}>
                  <button
                    type="button"
                    className={chatStyles.backToChatList}
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className={chatStyles.conversationIdentity}>
                    <h2 className={chatStyles.conversationTitle}>
                      {selectedConversationTitle}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className={styles.closeChatButton}
                    onClick={onClose}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className={chatStyles.stream}>
                  {selectedChat?.type === "campaign" ? (
                    room.campaignMessages.length === 0 ? (
                      <p className={styles.emptyState}>
                        Ainda nao ha mensagens no chat da campanha.
                      </p>
                    ) : (
                      room.campaignMessages.map((message, index, messages) =>
                        renderChatMessage(
                          message,
                          index === 0 ||
                            messages[index - 1]?.authorId !== message.authorId
                        )
                      )
                    )
                  ) : directThread.length === 0 ? (
                    <p className={styles.emptyState}>
                      Nenhuma mensagem privada com essa pessoa ainda.
                    </p>
                  ) : (
                    directThread.map((message) =>
                      renderChatMessage(message, false)
                    )
                  )}
                </div>

                <form
                  className={chatStyles.composer}
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (isCampaignEnded) return
                    void submitCurrentMessage()
                  }}
                >
                  <textarea
                    ref={composerTextareaRef}
                    rows={1}
                    value={
                      selectedChat?.type === "campaign"
                        ? campaignMessage
                        : directMessage
                    }
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
                      isBusy ||
                      isCampaignEnded ||
                      (selectedChat?.type === "direct" && !selectedParticipant)
                    }
                    aria-label="Enviar mensagem"
                  >
                    <SendHorizontal size={18} />
                  </button>
                </form>
              </div>
            ) : (
              <div className={chatStyles.chatListPane}>
                <div className={chatStyles.chatList}>
                  <button
                    type="button"
                    className={chatStyles.chatListItem}
                    onClick={() => setSelectedChat({ type: "campaign" })}
                  >
                    <div className={chatStyles.chatAvatar}>C</div>
                    <div className={chatStyles.chatListText}>
                      <strong>Chat da campanha</strong>
                      <small>Todos os participantes falam aqui</small>
                    </div>
                  </button>

                  {availableDirectParticipants.map((participant) => (
                    <button
                      key={participant.userId}
                      type="button"
                      className={chatStyles.chatListItem}
                      onClick={() => {
                        setSelectedUserId(participant.userId)
                        setSelectedChat({
                          type: "direct",
                          userId: participant.userId
                        })
                      }}
                    >
                      <div className={chatStyles.chatAvatar}>
                        {participant.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className={chatStyles.chatListText}>
                        <strong>{participant.name}</strong>
                        <small>@{participant.username}</small>
                      </div>
                    </button>
                  ))}

                  {availableDirectParticipants.length === 0 ? (
                    <p className={styles.emptyState}>
                      Nenhum outro participante disponivel para chat privado.
                    </p>
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
