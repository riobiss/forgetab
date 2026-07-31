import { describe, expect, it } from "vitest"
import {
  calculatePinchViewport,
  getLocalPinchCenter,
  preserveViewportOnResize,
} from "./mapZoom"

describe("mapZoom", () => {
  it("converte o centro do pinch da viewport para o canvas", () => {
    const center = getLocalPinchCenter(
      [
        { clientX: 150, clientY: 250 },
        { clientX: 250, clientY: 350 },
      ],
      { left: 100, top: 200 },
    )

    expect(center).toEqual({ x: 100, y: 100 })
  })

  it("mantem sob os dedos o mesmo ponto ao aplicar zoom e deslocamento juntos", () => {
    const viewport = calculatePinchViewport({
      currentScale: 1,
      minScale: 0.5,
      maxScale: 4,
      position: { x: 0, y: 0 },
      previousCenter: { x: 100, y: 100 },
      center: { x: 120, y: 110 },
      previousDistance: 100,
      distance: 150,
    })

    expect(viewport).toEqual({
      scale: 1.5,
      position: { x: -30, y: -40 },
    })
  })

  it("ignora uma amostra de pinch com distancia invalida", () => {
    const viewport = calculatePinchViewport({
      currentScale: 2,
      minScale: 1,
      maxScale: 4,
      position: { x: -50, y: -25 },
      previousCenter: { x: 100, y: 100 },
      center: { x: 100, y: 100 },
      previousDistance: 0,
      distance: 100,
    })

    expect(viewport).toEqual({
      scale: 2,
      position: { x: -50, y: -25 },
    })
  })

  it("eleva a escala ao novo minimo preservando o centro do conteudo", () => {
    const viewport = preserveViewportOnResize({
      previousWidth: 400,
      previousHeight: 300,
      nextWidth: 800,
      nextHeight: 600,
      currentScale: 0.5,
      minScale: 1,
      position: { x: 0, y: 0 },
    })

    expect(viewport).toEqual({
      scale: 1,
      position: { x: 0, y: 0 },
    })
  })

  it("mantem o zoom atual quando ele continua acima do minimo", () => {
    const viewport = preserveViewportOnResize({
      previousWidth: 400,
      previousHeight: 300,
      nextWidth: 500,
      nextHeight: 400,
      currentScale: 2,
      minScale: 1,
      position: { x: -100, y: -50 },
    })

    expect(viewport.scale).toBe(2)
    expect(viewport.position).toEqual({ x: -50, y: 0 })
  })
})
