import { beforeEach, describe, expect, it, vi } from "vitest"
import type Konva from "konva"
import {
  bindMapCanvasGestures,
  canInteractMap,
  type MapCanvasGestureOptions
} from "./mapCanvasGestures"
import { getContentPointerPosition } from "./mapCanvasStage"

vi.mock("./mapCanvasStage", () => ({
  applyStagePinchZoom: vi.fn(),
  applyStageZoom: vi.fn(),
  getContentPointerPosition: vi.fn(),
  syncMapInteraction: vi.fn()
}))

function createStageHarness() {
  const handlers = new Map<string, (event?: unknown) => void>()
  const stage = {
    on: vi.fn((events: string, handler: (event?: unknown) => void) => {
      handlers.set(events, handler)
    }),
    off: vi.fn(),
    draggable: vi.fn(() => false),
    startDrag: vi.fn()
  } as unknown as Konva.Stage

  return {
    stage,
    emit(events: string, event?: unknown) {
      handlers.get(events)?.(event)
    }
  }
}

function createOptions(
  overrides: Partial<MapCanvasGestureOptions> = {}
): MapCanvasGestureOptions {
  return {
    isInteractive: true,
    isFullscreen: true,
    isBrushMode: false,
    brushColor: "#000000",
    brushSize: 2,
    isMarkerSelectionMode: false,
    isMarkerRepositionMode: false,
    onAddPendingMarker: vi.fn(),
    onRepositionMarker: vi.fn(),
    ...overrides
  }
}

describe("mapCanvasGestures", () => {
  beforeEach(() => {
    vi.mocked(getContentPointerPosition).mockReturnValue({ x: 12, y: 20 })
  })

  it("requires fullscreen and interaction to manipulate the map", () => {
    expect(canInteractMap(true, true)).toBe(true)
    expect(canInteractMap(true, false)).toBe(false)
    expect(canInteractMap(false, true)).toBe(false)
  })

  it("routes mouse selection to the pending-marker action", () => {
    const harness = createStageHarness()
    const options = createOptions({ isMarkerSelectionMode: true })
    const controller = bindMapCanvasGestures({
      stage: harness.stage,
      getOptions: () => options,
      getMapImage: () => null,
      getDrawLayer: () => null,
      onViewChange: vi.fn()
    })

    harness.emit("mousedown")

    expect(options.onAddPendingMarker).toHaveBeenCalledWith({ x: 12, y: 20 })
    expect(options.onRepositionMarker).not.toHaveBeenCalled()
    controller.dispose()
  })

  it("handles a touch tap once and guards the following synthetic mouse event", () => {
    const harness = createStageHarness()
    const options = createOptions({ isMarkerRepositionMode: true })
    bindMapCanvasGestures({
      stage: harness.stage,
      getOptions: () => options,
      getMapImage: () => null,
      getDrawLayer: () => null,
      onViewChange: vi.fn()
    })

    harness.emit("touchstart", { evt: { touches: [{}] } })
    harness.emit("touchend touchcancel", { evt: { touches: [] } })
    harness.emit("mousedown")

    expect(options.onRepositionMarker).toHaveBeenCalledTimes(1)
    expect(options.onRepositionMarker).toHaveBeenCalledWith({ x: 12, y: 20 })
  })
})
