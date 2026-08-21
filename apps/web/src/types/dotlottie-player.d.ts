import type React from "react"

type DotLottiePlayerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string
    background?: string
    speed?: string | number
    autoplay?: boolean
    loop?: boolean
    dotLottie?: {
      totalFrames?: number
      play?: () => void | Promise<void>
      stop?: () => void | Promise<void>
      pause?: () => void | Promise<void>
      setFrame?: (frame: number) => void | Promise<void>
      setSpeed?: (speed: number) => void | Promise<void>
      addEventListener?: (type: "complete" | "load" | "ready", listener: () => void) => void
      removeEventListener?: (type: "complete" | "load" | "ready", listener: () => void) => void
    } | null
  },
  HTMLElement
>

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-wc": DotLottiePlayerProps
    }
  }
}

export {}
