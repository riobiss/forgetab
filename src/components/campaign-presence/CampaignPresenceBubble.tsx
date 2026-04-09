"use client"

import { MessageCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import {
  getCampaignPresence,
  getCampaignPresencePosition,
  setCampaignPresencePosition,
  subscribeToCampaignPresence,
  type CampaignPresence,
} from "@/infrastructure/rpgCampaign/campaignPresence"
import styles from "./CampaignPresenceBubble.module.css"

const DRAG_THRESHOLD = 6

export default function CampaignPresenceBubble() {
  const pathname = usePathname()
  const router = useRouter()
  const [presence, setPresence] = useState<CampaignPresence | null>(null)
  const [position, setPosition] = useState(() => getCampaignPresencePosition())
  const [isDragging, setIsDragging] = useState(false)
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const pointerStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startLeft: number
    startTop: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    setPresence(getCampaignPresence())
    return subscribeToCampaignPresence(() => {
      setPresence(getCampaignPresence())
    })
  }, [])

  const isCampaignRoomRoute = useMemo(
    () => /^\/rpg\/[^/]+\/campaign\/[^/]+$/.test(pathname),
    [pathname],
  )

  if (!presence || isCampaignRoomRoute || pathname === "/login" || pathname === "/register") {
    return null
  }

  function clampPosition(left: number, top: number) {
    const bubbleWidth = bubbleRef.current?.offsetWidth ?? 280
    const bubbleHeight = bubbleRef.current?.offsetHeight ?? 72
    const headerElement = document.querySelector("header")
    const headerHeight = headerElement instanceof HTMLElement ? headerElement.offsetHeight : 0
    const minTop = headerHeight + 16
    const maxLeft = Math.max(16, window.innerWidth - bubbleWidth - 16)
    const maxTop = Math.max(minTop, window.innerHeight - bubbleHeight - 16)

    return {
      x: Math.min(Math.max(16, left), maxLeft),
      y: Math.min(Math.max(minTop, top), maxTop),
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const bubbleHeight = bubbleRef.current?.offsetHeight ?? 72
    const headerElement = document.querySelector("header")
    const headerHeight = headerElement instanceof HTMLElement ? headerElement.offsetHeight : 0
    const currentLeft = position?.x ?? 16
    const currentTop = position?.y ?? Math.max(headerHeight + 16, window.innerHeight - bubbleHeight - 16)

    pointerStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      moved: false,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pointerState = pointerStateRef.current
    if (!pointerState || pointerState.pointerId !== event.pointerId) return

    const deltaX = event.clientX - pointerState.startX
    const deltaY = event.clientY - pointerState.startY
    const nextPosition = clampPosition(pointerState.startLeft + deltaX, pointerState.startTop + deltaY)

    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      pointerState.moved = true
      setIsDragging(true)
    }

    setPosition(nextPosition)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const pointerState = pointerStateRef.current
    if (!pointerState || pointerState.pointerId !== event.pointerId) return
    const activePresence = presence

    event.currentTarget.releasePointerCapture(event.pointerId)
    pointerStateRef.current = null
    setIsDragging(false)

    if (position) {
      setCampaignPresencePosition(position)
    }

    if (!pointerState.moved && activePresence) {
      router.push(`/rpg/${activePresence.rpgId}/campaign/${activePresence.campaignId}`)
    }
  }

  return (
    <div
      ref={bubbleRef}
      className={`${styles.bubble} ${isDragging ? styles.bubbleDragging : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
    >
      <button type="button" className={styles.bubbleButton} tabIndex={-1} aria-label="Abrir campanha atual">
        <span className={styles.bubbleIcon}>
          <MessageCircle size={18} />
        </span>
        <span className={styles.bubbleText}>
          <strong>Campanha...</strong>
          <small>{presence.title}</small>
        </span>
      </button>
    </div>
  )
}
