import styles from "../CharactersDashboardPage.module.css"

type Props = {
  createPlayerHref: string
  isOwner: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export default function CharacterCreationPermission({
  isOwner,
  isAcceptedMember,
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
      ) : null}
    </section>
  )
}
