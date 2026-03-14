import Link from "next/link"
import styles from "../CharactersDashboardPage.module.css"

type Props = {
  createPlayerHref: string
  isOwner: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export default function CharacterCreationPermission({
  createPlayerHref,
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
      ) : allowMultiplePlayerCharacters ? (
        <Link className={styles.primaryAction} href={createPlayerHref}>
          Criar outro personagem
        </Link>
      ) : ownPlayerCount > 0 ? (
        <p className={styles.permissionInfo}>
          O mestre nao permite mais de um personagem por player neste RPG.
        </p>
      ) : null}
    </section>
  )
}
