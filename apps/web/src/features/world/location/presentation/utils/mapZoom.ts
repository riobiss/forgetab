export type ViewportPoint = { x: number; y: number }

type TouchPoint = { clientX: number; clientY: number }

export function getLocalPinchCenter(
  touches: ArrayLike<TouchPoint>,
  bounds: { left: number; top: number },
): ViewportPoint | null {
  const first = touches[0]
  const second = touches[1]
  if (!first || !second) return null

  return {
    x: (first.clientX + second.clientX) / 2 - bounds.left,
    y: (first.clientY + second.clientY) / 2 - bounds.top,
  }
}

export function calculatePinchViewport(params: {
  currentScale: number
  minScale: number
  maxScale: number
  position: ViewportPoint
  previousCenter: ViewportPoint
  center: ViewportPoint
  previousDistance: number
  distance: number
}) {
  if (
    params.currentScale <= 0 ||
    params.previousDistance <= 0 ||
    params.distance <= 0
  ) {
    return {
      scale: params.currentScale,
      position: params.position,
    }
  }

  const contentPoint = {
    x:
      (params.previousCenter.x - params.position.x) /
      params.currentScale,
    y:
      (params.previousCenter.y - params.position.y) /
      params.currentScale,
  }
  const nextScale =
    params.currentScale * (params.distance / params.previousDistance)
  const scale = Math.max(
    params.minScale,
    Math.min(params.maxScale, nextScale),
  )

  return {
    scale,
    position: {
      x: params.center.x - contentPoint.x * scale,
      y: params.center.y - contentPoint.y * scale,
    },
  }
}

export function preserveViewportOnResize(params: {
  previousWidth: number
  previousHeight: number
  nextWidth: number
  nextHeight: number
  currentScale: number
  minScale: number
  position: ViewportPoint
}) {
  const scale = Math.max(params.currentScale, params.minScale)
  if (
    params.previousWidth <= 0 ||
    params.previousHeight <= 0 ||
    params.currentScale <= 0
  ) {
    return { scale, position: params.position }
  }

  const previousCenter = {
    x: params.previousWidth / 2,
    y: params.previousHeight / 2,
  }
  const contentPoint = {
    x:
      (previousCenter.x - params.position.x) /
      params.currentScale,
    y:
      (previousCenter.y - params.position.y) /
      params.currentScale,
  }
  const nextCenter = {
    x: params.nextWidth / 2,
    y: params.nextHeight / 2,
  }

  return {
    scale,
    position: {
      x: nextCenter.x - contentPoint.x * scale,
      y: nextCenter.y - contentPoint.y * scale,
    },
  }
}
