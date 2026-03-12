import { formatDateInBrasilia } from "@/lib/date"
import type { ProfileViewData } from "@/application/profile/types"
import styles from "./ProfilePage.module.css"

type Props = {
  data: ProfileViewData
}

export default function ProfilePage({ data }: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Perfil</h1>
        <p>Informacoes da sua conta.</p>

        <div className={styles.infoGrid}>
          <div>
            <span>Nome</span>
            <strong>{data.name ?? "-"}</strong>
          </div>

          <div>
            <span>Username</span>
            <strong>{data.username ? `@${data.username}` : "-"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{data.email}</strong>
          </div>

          <div>
            <span>Criado em</span>
            <strong>{data.createdAt ? formatDateInBrasilia(data.createdAt) : "-"}</strong>
          </div>
        </div>
      </section>
    </main>
  )
}
