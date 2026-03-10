import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import MembershipNotifications from "@/presentation/rpg-dashboard/components/MembershipNotifications"
import MembersList from "@/presentation/rpg-dashboard/components/MembersList"
import QuickCreateMenu from "@/presentation/rpg-dashboard/components/QuickCreateMenu"
import RpgInfoModalButton from "@/presentation/rpg-dashboard/components/RpgInfoModalButton"
import SpectatorVisionPanel from "@/presentation/rpg-dashboard/components/SpectatorVisionPanel"
import type { RpgDashboardViewModel } from "@/application/rpgDashboard/types"
import styles from "@/presentation/rpg-dashboard/RpgDashboardPage.module.css"

function truncateText(text: string, limit: number) {
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}...`
}

export function RpgDashboardPage({ viewModel }: { viewModel: RpgDashboardViewModel }) {
  const limitedDescription = truncateText(viewModel.rpg.description, 400)
  const createdAtLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(viewModel.rpg.createdAt)

  if (!viewModel.canViewFullContent) {
    return (
      <div className={styles.container}>
        <div className={styles.topActions}>
          <RpgInfoModalButton
            title={viewModel.rpg.title}
            description={limitedDescription}
            masterName={viewModel.rpg.ownerName}
            visibility={viewModel.rpg.visibility}
            createdAt={createdAtLabel}
            membersCount={0}
          />
        </div>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{viewModel.rpg.title}</h2>
        </div>
        <MembershipNotifications
          rpgId={viewModel.rpg.id}
          isOwner={viewModel.isOwner}
          isAuthenticated={viewModel.isAuthenticated}
          membershipStatus={viewModel.membershipStatus}
          pendingRequests={[]}
          pendingCharacterRequests={[]}
          simpleJoin
        />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <MembershipNotifications
          rpgId={viewModel.rpg.id}
          isOwner={viewModel.canManageRpg}
          isAuthenticated={viewModel.isAuthenticated}
          membershipStatus={viewModel.membershipStatus}
          pendingRequests={viewModel.pendingRequests.map((item) => ({
            ...item,
            requestedAt: item.requestedAt.toISOString(),
          }))}
          pendingCharacterRequests={viewModel.pendingCharacterRequests.map((item) => ({
            ...item,
            requestedAt: item.requestedAt.toISOString(),
          }))}
          compact
        />
        {viewModel.canManageRpg ? <QuickCreateMenu rpgId={viewModel.rpg.id} /> : null}
        {viewModel.canManageRpg ? (
          <MembersList
            rpgId={viewModel.rpg.id}
            members={viewModel.acceptedMembers}
            compact
            usersCanManageOwnXp={viewModel.rpg.usersCanManageOwnXp}
            allowSkillPointDistribution={viewModel.rpg.allowSkillPointDistribution}
          />
        ) : null}
        <RpgInfoModalButton
          title={viewModel.rpg.title}
          description={limitedDescription}
          masterName={viewModel.rpg.ownerName}
          visibility={viewModel.rpg.visibility}
          createdAt={createdAtLabel}
          membersCount={viewModel.acceptedMembersCount}
        />
        {viewModel.canManageRpg ? (
          <Link
            href={`/rpg/${viewModel.rpg.id}/edit`}
            className={styles.settingsButton}
            aria-label="Configurar RPG"
            title="Configurar RPG"
          >
            <Settings size={18} />
          </Link>
        ) : null}
      </div>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{viewModel.rpg.title}</h2>
      </div>

      {viewModel.isOwner ? (
        <SpectatorVisionPanel
          rpgId={viewModel.rpg.id}
          characters={viewModel.spectatorCharacters}
          attributeLabels={viewModel.attributeLabels}
          skillLabels={viewModel.skillLabels}
          statusLabels={viewModel.statusLabels}
        />
      ) : null}

      <h3 className={styles.sectionTitle}>Sessoes</h3>

      <div className={styles.cards}>
        <Link href={`/rpg/${viewModel.rpg.id}/characters`} className={styles.card}>
          <Image src="/images/bg-characters.jpg" alt="Personagens" fill className={styles.cardImage} />
          <span>Personagens</span>
        </Link>

        {viewModel.hasRaces ? (
          <Link href={`/rpg/${viewModel.rpg.id}/races`} className={styles.card}>
            <Image src="/images/bg-races.jpg" alt="Racas" fill className={styles.cardImage} />
            <span>Racas</span>
          </Link>
        ) : null}

        {viewModel.hasClasses ? (
          <Link href={`/rpg/${viewModel.rpg.id}/classes`} className={styles.card}>
            <Image src="/images/bg-classes.webp" alt="Classes" fill className={styles.cardImage} />
            <span>Classes</span>
          </Link>
        ) : null}

        {viewModel.rpg.useMundiMap ? (
          <Link href={`/rpg/${viewModel.rpg.id}/map`} className={styles.card}>
            <Image src="/images/bg-regions.jpg" alt="Mapa Mundi" fill className={styles.cardImage} />
            <span>Mapa Mundi</span>
          </Link>
        ) : null}

        {viewModel.canManageRpg ? (
          <Link href={`/rpg/${viewModel.rpg.id}/items`} className={styles.card}>
            <Image src="/images/bg-items.png" alt="Itens" fill className={styles.cardImage} />
            <span>Items</span>
          </Link>
        ) : null}

        <Link href={`/rpg/${viewModel.rpg.id}/library`} className={styles.card}>
          <Image src="/images/bg-library.jpg" alt="Biblioteca" fill className={styles.cardImage} />
          <span>Biblioteca</span>
        </Link>
      </div>
    </div>
  )
}
