import Konva from "konva"

export function drawMarkerPin(params: {
  layer: Konva.Layer
  x: number
  y: number
  color: string
  label: string
  opacity?: number
  dashed?: boolean
  onClick?: () => void
}) {
  const group = new Konva.Group({
    x: params.x,
    y: params.y,
    listening: Boolean(params.onClick),
    opacity: params.opacity ?? 1,
  })

  const outerCircle = new Konva.Circle({
    x: 0,
    y: -14,
    radius: 14,
    fill: params.color,
    stroke: "rgba(15, 23, 42, 0.95)",
    strokeWidth: 2,
    dash: params.dashed ? [4, 3] : undefined,
  })

  const pointer = new Konva.Line({
    points: [-7, -4, 0, 10, 7, -4],
    closed: true,
    fill: params.color,
    stroke: "rgba(15, 23, 42, 0.95)",
    strokeWidth: 2,
    dash: params.dashed ? [4, 3] : undefined,
  })

  const isNamedMarker = params.label.length > 2
  const text = new Konva.Text({
    x: isNamedMarker ? -44 : -12,
    y: isNamedMarker ? -46 : -23,
    width: isNamedMarker ? 88 : 24,
    align: "center",
    text: params.label,
    fontSize: 12,
    fontStyle: "bold",
    fill: "#ffffff",
  })

  const nameBubble = isNamedMarker
    ? new Konva.Rect({
        x: -48,
        y: -49,
        width: 96,
        height: 22,
        cornerRadius: 999,
        fill: "rgba(15, 23, 42, 0.92)",
        stroke: params.color,
        strokeWidth: 1.5,
      })
    : null

  group.add(pointer)
  group.add(outerCircle)
  if (nameBubble) {
    group.add(nameBubble)
  }
  group.add(text)
  if (params.onClick) {
    group.on("click tap", params.onClick)
  }
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
