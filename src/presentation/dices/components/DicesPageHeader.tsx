import styles from "../DicesPage.module.css"

type DicesPageHeaderProps = {
  activeView: "dices" | "history"
  onChangeView: (view: "dices" | "history") => void
}

export function DicesPageHeader({ activeView, onChangeView }: DicesPageHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 id="dices-title" className={styles.srOnly}>Dados</h1>
      <div className={styles.headerTabs} role="tablist" aria-label="Visualização de dados">
        <button
          type="button"
          className={`${styles.headerTab} ${activeView === "dices" ? styles.headerTabActive : ""}`}
          onClick={() => onChangeView("dices")}
          role="tab"
          aria-selected={activeView === "dices"}
        >
          Dados
        </button>
        <button
          type="button"
          className={`${styles.headerTab} ${activeView === "history" ? styles.headerTabActive : ""}`}
          onClick={() => onChangeView("history")}
          role="tab"
          aria-selected={activeView === "history"}
        >
          Historico
        </button>
      </div>
    </header>
  )
}
