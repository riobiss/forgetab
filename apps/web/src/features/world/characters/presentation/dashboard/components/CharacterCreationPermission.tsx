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

  const hasOwnPlayer = ownPlayerCount > 0
  const canCreateAnotherPlayer = isAcceptedMember && (!hasOwnPlayer || allowMultiplePlayerCharacters)

  if (!canCreateAnotherPlayer && isAcceptedMember) {
    return null
  }

  return (
    <section className={styles.permissionCard}>
      {!isAcceptedMember ? (
        <p className={styles.permissionInfo}>
          Voce precisa ser membro aceito para criar personagem.
        </p>
      ) : (
        <Link className={styles.primaryButton} href={createPlayerHref}>
          {hasOwnPlayer ? "Criar outro personagem" : "Criar personagem"}
        </Link>
      )}
    </section>
  )
}
