import Link from "next/link"
import styles from "../CharactersDashboardPage.module.css"

type Props = {
  rpgId: string
  isOwner: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export default function CharacterCreationPermission({
  rpgId,
  isOwner,
  isAcceptedMember,
  ownPlayerCount,
  allowMultiplePlayerCharacters,
}: Props) {
  if (isOwner) {
    return null
  }

  return (
    <section className={styles.permissionCard}>
      {!isAcceptedMember ? (
        <p className={styles.permissionInfo}>
          Voce precisa ser membro aceito para criar personagem.
        </p>
      ) : ownPlayerCount === 0 ? (
        <>
          <p className={styles.permissionInfo}>Voce pode criar seu primeiro personagem.</p>
          <Link className={styles.primaryAction} href={`/rpg/${rpgId}/characters/new`}>
            Criar personagem
          </Link>
        </>
      ) : allowMultiplePlayerCharacters ? (
        <>
          <p className={styles.permissionInfo}>
            O mestre permite mais de um personagem por player neste RPG.
          </p>
          <Link className={styles.primaryAction} href={`/rpg/${rpgId}/characters/new`}>
            Criar outro personagem
          </Link>
        </>
      ) : null}
    </section>
  )
}
