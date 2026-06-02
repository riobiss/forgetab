import { ChevronRight } from "lucide-react"
import { formatDateInBrasilia } from "@/lib/date"
import type { ProfileViewData } from "@/application/profile/types"
import ProfileEditableField from "./ProfileEditableField"
import ProfileRpgNicknameField from "./ProfileRpgNicknameField"
import styles from "./ProfilePage.module.css"

type Props = {
  data: ProfileViewData
}

export default function ProfilePage({ data }: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <h1>Perfil</h1>
        <p>Informacoes da sua conta e dos seus perfis de jogo.</p>

        <div className={styles.tabs}>
          <input
            className={styles.tabInput}
            type="radio"
            name="profile-tab"
            id="profile-main-tab"
            defaultChecked
          />
          <input
            className={styles.tabInput}
            type="radio"
            name="profile-tab"
            id="profile-rpg-tab"
          />

          <div className={styles.tabList} role="tablist" aria-label="Secoes do perfil">
            <label className={styles.tabButton} htmlFor="profile-main-tab" role="tab">
              Perfil Principal
            </label>
            <label className={styles.tabButton} htmlFor="profile-rpg-tab" role="tab">
              Perfis por RPG
            </label>
          </div>

          <div className={`${styles.tabPanel} ${styles.mainPanel}`} role="tabpanel">
            <div className={styles.infoGrid}>
              <div>
                <span>Nome</span>
                <ProfileEditableField
                  field="name"
                  value={data.name}
                  displayValue={data.name ?? "-"}
                  editLabel="Editar nome"
                />
              </div>

              <div>
                <span>Username</span>
                <ProfileEditableField
                  field="username"
                  value={data.username}
                  displayValue={data.username ? `@${data.username}` : "-"}
                  editLabel="Editar username"
                />
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
          </div>

          <div className={`${styles.tabPanel} ${styles.rpgPanel}`} role="tabpanel">
            {data.rpgProfiles.length > 0 ? (
              <div className={styles.rpgList}>
                {data.rpgProfiles.map((rpg) => (
                  <details key={rpg.id} className={styles.rpgItem}>
                    <summary className={styles.rpgSummary}>
                      <span>{rpg.title}</span>
                      <ChevronRight size={18} className={styles.rpgChevron} aria-hidden="true" />
                    </summary>

                    <div className={styles.rpgDetails}>
                      <div>
                        <span>Apelido no RPG</span>
                        <ProfileRpgNicknameField rpgId={rpg.id} nickname={rpg.nickname} />
                      </div>

                      <div>
                        <span>Personagens que controla</span>
                        {rpg.characters.length > 0 ? (
                          <ul className={styles.characterList}>
                            {rpg.characters.map((character) => (
                              <li key={character.id}>{character.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <strong>-</strong>
                        )}
                      </div>

                      <div>
                        <span>Data de entrada</span>
                        <strong>{rpg.joinedAt ? formatDateInBrasilia(rpg.joinedAt) : "-"}</strong>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>Nenhum perfil por RPG cadastrado.</strong>
                <span>Quando voce participar de uma campanha, ela aparecera aqui.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
