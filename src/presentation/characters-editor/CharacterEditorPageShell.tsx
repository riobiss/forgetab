import type { ReactNode } from "react"
import styles from "./CharacterEditorPageShell.module.css"

type Props = {
  children: ReactNode
}

export default function CharacterEditorPageShell({ children }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.editorSurface}>{children}</div>
    </main>
  )
}
