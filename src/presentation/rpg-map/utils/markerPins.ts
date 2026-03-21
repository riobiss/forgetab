import Konva from "konva"
import type { MarkerPinStyle } from "@/presentation/rpg-map/types/mapMarkers"

export type MarkerRenderMode = "full" | "compact" | "dot"

export function drawMarkerPin(params: {
  layer: Konva.Layer
  x: number
  y: number
  color: string
  label: string
  size?: number | null
  pinStyle?: MarkerPinStyle | null
  renderMode?: MarkerRenderMode
  opacity?: number
  dashed?: boolean
  onClick?: () => void
}) {
  const bindClickHandlers = (group: Konva.Group) => {
    if (!params.onClick) {
      return
    }

    group.on("mousedown touchstart", (event) => {
      event.cancelBubble = true
    })

    group.on("click tap", (event) => {
      event.cancelBubble = true
      params.onClick?.()
    })
  }

  const size = Math.max(0.5, Math.min(2, params.size ?? 1))
  const renderMode = params.renderMode ?? "full"
  const pinStyle =
    renderMode === "full" && params.pinStyle === "label" ? "label" : "default"
  const isNamedMarker = params.label.length > 2
  const group = new Konva.Group({
    x: params.x,
    y: params.y,
    listening: Boolean(params.onClick),
    opacity: params.opacity ?? 1,
    perfectDrawEnabled: false,
  })

  if (renderMode === "dot") {
    const dot = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 7 * size,
      fill: params.color,
      stroke: "rgba(15, 23, 42, 0.95)",
      strokeWidth: 2,
      dash: params.dashed ? [4, 3] : undefined,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
    })

    group.add(dot)
    bindClickHandlers(group)
    params.layer.add(group)
    return group
  }

  if (pinStyle === "label") {
    const bubbleWidth = Math.max(92, params.label.length * 8 + 24) * size
    const bubbleHeight = 30 * size
    const bubble = new Konva.Rect({
      x: -(bubbleWidth / 2),
      y: -(bubbleHeight / 2),
      width: bubbleWidth,
      height: bubbleHeight,
      cornerRadius: 999,
      fill: "rgba(15, 23, 42, 0.94)",
      stroke: params.color,
      strokeWidth: 2,
      dash: params.dashed ? [4, 3] : undefined,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
    })
    const text = new Konva.Text({
      x: -(bubbleWidth / 2),
      y: -(bubbleHeight / 2) + 7 * size,
      width: bubbleWidth,
      align: "center",
      text: params.label,
      fontSize: 13 * size,
      fontStyle: "bold",
      fill: "#ffffff",
      listening: false,
      perfectDrawEnabled: false,
    })

    group.add(bubble)
    group.add(text)
    bindClickHandlers(group)
    params.layer.add(group)
    return group
  }

  const outerCircle = new Konva.Circle({
    x: 0,
    y: -14 * size,
    radius: 14 * size,
    fill: params.color,
    stroke: "rgba(15, 23, 42, 0.95)",
    strokeWidth: 2,
    dash: params.dashed ? [4, 3] : undefined,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
  })

  const pointer = new Konva.Line({
    points: [-7 * size, -4 * size, 0, 10 * size, 7 * size, -4 * size],
    closed: true,
    fill: params.color,
    stroke: "rgba(15, 23, 42, 0.95)",
    strokeWidth: 2,
    dash: params.dashed ? [4, 3] : undefined,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
  })

  const text = new Konva.Text({
    x: isNamedMarker ? -44 * size : -12 * size,
    y: isNamedMarker ? -46 * size : -23 * size,
    width: isNamedMarker ? 88 * size : 24 * size,
    align: "center",
    text: params.label,
    fontSize: 12 * size,
    fontStyle: "bold",
    fill: "#ffffff",
    listening: false,
    perfectDrawEnabled: false,
  })

  const nameBubble = isNamedMarker
    ? new Konva.Rect({
        x: -48 * size,
        y: -49 * size,
        width: 96 * size,
        height: 22 * size,
        cornerRadius: 999,
        fill: "rgba(15, 23, 42, 0.92)",
        stroke: params.color,
        strokeWidth: 1.5,
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
      })
    : null

  group.add(pointer)
  group.add(outerCircle)
  if (renderMode === "full" && nameBubble) {
    group.add(nameBubble)
  }
  if (renderMode === "full") {
    group.add(text)
  }
  bindClickHandlers(group)
  params.layer.add(group)
  return group
}

export function getMarkerDisplayLabel(name: string, fallbackNumber: number) {
  const normalizedName = name.trim()
  if (!normalizedName || normalizedName === `Marcador ${fallbackNumber}`) {
    return String(fallbackNumber)
  }

  return normalizedName.length > 12 ? `${normalizedName.slice(0, 11)}…` : normalizedName
}
